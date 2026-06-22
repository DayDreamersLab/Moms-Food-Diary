from argparse import ArgumentParser
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
import json
import os
import re
import time

from pytorch_route_ranker.app.config import RANKER_ROOT
from pytorch_route_ranker.app.registry import load_registry, registry_fingerprint
from pytorch_route_ranker.app.text_features import normalize_text
from pytorch_route_ranker.scripts.generate_hard_examples import (
    call_ollama,
    label_key,
    read_jsonl,
    remove_near_duplicates,
    unique_strings,
    validate_training_record,
    write_json_atomic,
    write_jsonl_atomic,
)
from pytorch_route_ranker.scripts.generate_training_data import (
    PURPOSE_LABELS,
    normalize_label,
    plain_keyword_values,
    route_purposes,
    route_topics,
    tagged_keyword_values,
)


DATA_ROOT = RANKER_ROOT / "data"
DEFAULT_REGISTRY_PATH = DATA_ROOT / "route_registry.json"
DEFAULT_OUTPUT_PATH = DATA_ROOT / "synthetic_expert_seed_examples.jsonl"
DEFAULT_MANIFEST_PATH = DATA_ROOT / "synthetic_expert_seed_manifest.json"
DEFAULT_PROGRESS_PATH = DATA_ROOT / "synthetic_expert_seed_progress.json"
DEFAULT_REFERENCE_PATHS = [
    DATA_ROOT / "generated_training_examples.jsonl",
    DATA_ROOT / "expert_training_examples.jsonl",
    DATA_ROOT / "hard_example_training_data.jsonl",
]
TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
URL_PATTERN = re.compile(r"(?:https?://|www\.)", re.IGNORECASE)
MULTIPLE_PATTERN = re.compile(
    r"\b(?:all|any and all|complete|comprehensive|each|entire|every|everything|full|whole)\b|"
    r"\b(?:collection|pages|set|sources)\b",
    re.IGNORECASE,
)


def parse_args():
    parser = ArgumentParser(
        description="Generate validated synthetic expert-seed training examples with local Ollama."
    )
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST_PATH)
    parser.add_argument("--progress", type=Path, default=DEFAULT_PROGRESS_PATH)
    parser.add_argument(
        "--reference-data",
        type=Path,
        nargs="*",
        default=DEFAULT_REFERENCE_PATHS,
        help="Existing training JSONL files checked for duplicate or conflicting queries.",
    )
    parser.add_argument(
        "--model",
        default=(
            os.getenv("SYNTHETIC_EXPERT_LLM_MODEL")
            or os.getenv("OLLAMA_MODEL")
            or "qwen3:latest"
        ),
    )
    parser.add_argument(
        "--validator-model",
        default=(
            os.getenv("SYNTHETIC_EXPERT_VALIDATOR_MODEL")
            or os.getenv("SYNTHETIC_EXPERT_LLM_MODEL")
            or os.getenv("OLLAMA_MODEL")
            or "qwen3:latest"
        ),
        help="Local model used to reject generated queries that are not supported by route metadata.",
    )
    parser.add_argument(
        "--ollama-url",
        default=(
            os.getenv("SYNTHETIC_EXPERT_OLLAMA_URL")
            or os.getenv("OLLAMA_URL")
            or "http://127.0.0.1:11434/api/chat"
        ),
    )
    parser.add_argument("--target-count", type=int, default=2000)
    parser.add_argument("--tasks-per-call", type=int, default=4)
    parser.add_argument(
        "--task-order",
        choices=["balanced", "source"],
        default="balanced",
        help="balanced interleaves singles, hard distinctions, topics, and purposes.",
    )
    parser.add_argument("--single-examples-per-route", type=int, default=10)
    parser.add_argument("--hard-examples-per-route", type=int, default=4)
    parser.add_argument("--topic-examples-per-group", type=int, default=10)
    parser.add_argument("--purpose-examples-per-group", type=int, default=8)
    parser.add_argument("--contrast-route-limit", type=int, default=2)
    parser.add_argument("--group-route-context-limit", type=int, default=8)
    parser.add_argument("--route-topic-limit", type=int, default=5)
    parser.add_argument("--route-purpose-limit", type=int, default=2)
    parser.add_argument("--route-phrase-limit", type=int, default=3)
    parser.add_argument("--plain-keyword-limit", type=int, default=8)
    parser.add_argument("--minimum-num-predict", type=int, default=320)
    parser.add_argument("--num-predict-per-example", type=int, default=20)
    parser.add_argument("--num-ctx", type=int, default=2048)
    parser.add_argument(
        "--include-descriptions",
        action="store_true",
        help="Include route descriptions in Ollama prompts. Slower but sometimes richer.",
    )
    parser.add_argument("--timeout-seconds", type=float, default=180.0)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show the planned fixed-label generation tasks without calling Ollama or writing files.",
    )
    parser.add_argument(
        "--skip-semantic-validation",
        action="store_true",
        help="Skip the metadata-bound validator pass and rely only on deterministic checks.",
    )
    return parser.parse_args()


def normalize_query(value: str) -> str:
    return normalize_text(value)


def compact_route(route: dict, args) -> dict:
    compact = {
        "title": route["title"],
        "topics": route_topics(route)[: args.route_topic_limit],
        "purposes": route_purposes(route)[: args.route_purpose_limit],
        "routePhrases": tagged_keyword_values(route, "route")[: args.route_phrase_limit],
        "plainKeywords": plain_keyword_values(route)[: args.plain_keyword_limit],
    }
    if args.include_descriptions:
        compact["description"] = route["description"]
    return compact


def source_priority(source: str) -> int:
    return {
        "synthetic-expert-single": 0,
        "synthetic-expert-hard-distinction": 1,
        "synthetic-expert-topic": 2,
        "synthetic-expert-purpose": 3,
    }.get(source, 9)


def build_reference_index(paths: list[Path], valid_route_ids: set[str]) -> dict[str, tuple[str, tuple[str, ...]]]:
    reference_index = {}
    for path in paths:
        for record in read_jsonl(path):
            validate_training_record(record, valid_route_ids, str(path))
            normalized = normalize_query(record["query"])
            label = label_key(record["scope"], record["relevantRouteIds"])
            previous_label = reference_index.get(normalized)
            if previous_label and previous_label != label:
                raise ValueError(
                    f"Existing reference data assigns conflicting labels to query {record['query']!r}."
                )
            reference_index[normalized] = label
    return reference_index


def grouped_routes(routes: list[dict], values_for_route) -> dict[str, list[dict]]:
    groups = defaultdict(list)
    for route in routes:
        for value in values_for_route(route):
            groups[value].append(route)
    return groups


def similar_routes(route: dict, routes: list[dict], limit: int = 6) -> list[dict]:
    route_id = route["id"]
    route_topic_set = set(route_topics(route))
    route_purpose_set = set(route_purposes(route))
    scored = []
    for candidate in routes:
        if candidate["id"] == route_id:
            continue
        score = len(route_topic_set & set(route_topics(candidate))) * 3
        score += len(route_purpose_set & set(route_purposes(candidate))) * 2
        if score:
            scored.append((score, candidate["title"], candidate))
    scored.sort(key=lambda item: (-item[0], item[1]))
    return [candidate for _, _, candidate in scored[:limit]]


def order_tasks(tasks: list[dict], task_order: str) -> list[dict]:
    sorted_tasks = sorted(tasks, key=lambda task: (source_priority(task["source"]), task["taskId"]))
    if task_order == "source":
        return sorted_tasks

    groups = defaultdict(list)
    for task in sorted_tasks:
        groups[task["source"]].append(task)
    ordered_sources = sorted(groups, key=source_priority)
    ordered_tasks = []
    while any(groups.values()):
        for source in ordered_sources:
            if groups[source]:
                ordered_tasks.append(groups[source].pop(0))
    return ordered_tasks


def build_tasks(routes: list[dict], args) -> list[dict]:
    tasks = []
    for route in routes:
        tasks.append(
            {
                "taskId": f"single:{route['id']}",
                "kind": "single-route-natural",
                "scope": "single",
                "relevantRouteIds": [route["id"]],
                "examplesNeeded": args.single_examples_per_route,
                "source": "synthetic-expert-single",
                "target": route["title"],
                "approvedRoutes": [compact_route(route, args)],
                "contrastRoutes": [
                    compact_route(candidate, args)
                    for candidate in similar_routes(route, routes, args.contrast_route_limit)
                ],
                "instructions": (
                    "Write natural queries for exactly this one page. Prefer phrases that real "
                    "users may type, including shorthand, abbreviations, fragments, and questions. "
                    "Do not introduce concepts, measurements, weather variables, probabilities, "
                    "risks, or product names that are absent from this route metadata."
                ),
            }
        )
        tasks.append(
            {
                "taskId": f"hard:{route['id']}",
                "kind": "single-route-hard-distinction",
                "scope": "single",
                "relevantRouteIds": [route["id"]],
                "examplesNeeded": args.hard_examples_per_route,
                "source": "synthetic-expert-hard-distinction",
                "target": route["title"],
                "approvedRoutes": [compact_route(route, args)],
                "contrastRoutes": [
                    compact_route(candidate, args)
                    for candidate in similar_routes(route, routes, args.contrast_route_limit)
                ],
                "instructions": (
                    "Write queries that distinguish this page from the contrast routes. Use words "
                    "like current, forecast, alert, map, threshold, source, history, only, or not "
                    "only when they truly match the approved route metadata. Do not invent related "
                    "aviation or weather concepts from general knowledge."
                ),
            }
        )

    for topic, topic_routes in grouped_routes(routes, route_topics).items():
        if len(topic_routes) < 2:
            continue
        tasks.append(
            {
                "taskId": f"topic:{topic}",
                "kind": "multiple-topic",
                "scope": "multiple",
                "relevantRouteIds": [route["id"] for route in topic_routes],
                "examplesNeeded": args.topic_examples_per_group,
                "source": "synthetic-expert-topic",
                "target": topic,
                "approvedRoutes": [
                    compact_route(route, args)
                    for route in topic_routes[: args.group_route_context_limit]
                ],
                "contrastRoutes": [],
                "instructions": (
                    "Write broad queries that clearly ask for all, every, complete, or multiple "
                    "available pages for this topic. Stay inside the supplied topic and route "
                    "metadata; do not add unstated subtopics."
                ),
            }
        )

    for purpose, purpose_routes in grouped_routes(routes, route_purposes).items():
        if len(purpose_routes) < 2:
            continue
        purpose_label = PURPOSE_LABELS.get(purpose, [purpose.replace("-", " ")])[0]
        tasks.append(
            {
                "taskId": f"purpose:{purpose}",
                "kind": "multiple-purpose",
                "scope": "multiple",
                "relevantRouteIds": [route["id"] for route in purpose_routes],
                "examplesNeeded": args.purpose_examples_per_group,
                "source": "synthetic-expert-purpose",
                "target": purpose_label,
                "approvedRoutes": [
                    compact_route(route, args)
                    for route in purpose_routes[: args.group_route_context_limit]
                ],
                "contrastRoutes": [],
                "instructions": (
                    "Write broad queries that ask for all pages with this presentation type, "
                    "not one subject-specific page. Stay inside the supplied purpose and route "
                    "metadata; do not add unstated subjects."
                ),
            }
        )

    return [
        task for task in tasks
        if task["examplesNeeded"] > 0 and task["relevantRouteIds"]
    ]


def task_plan(tasks: list[dict]) -> dict:
    by_source = defaultdict(lambda: {"tasks": 0, "plannedExamples": 0})
    for task in tasks:
        by_source[task["source"]]["tasks"] += 1
        by_source[task["source"]]["plannedExamples"] += task["examplesNeeded"]
    return {
        source: by_source[source]
        for source in sorted(by_source)
    }


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def progress_snapshot(
    *,
    args,
    report: dict,
    started_at: float,
    current_count: int,
    remaining_tasks: int,
    status: str,
    error: str | None = None,
) -> dict:
    elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
    elapsed_minutes = elapsed_ms / 60000 if elapsed_ms > 0 else 0
    accepted_examples = report["acceptedExamples"]
    snapshot = {
        "schemaVersion": 1,
        "status": status,
        "generatedAt": report["generatedAt"],
        "updatedAt": utc_timestamp(),
        "generatorModel": args.model,
        "ollamaUrl": args.ollama_url,
        "registryFingerprint": report["registryFingerprint"],
        "targetCount": args.target_count,
        "existingExamplesRetained": report["existingExamplesRetained"],
        "totalOutputExamples": current_count,
        "acceptedExamples": accepted_examples,
        "plannedTasks": report["plannedTasks"],
        "remainingTasks": remaining_tasks,
        "plannedExamples": report["plannedExamples"],
        "batchesCalled": report["batchesCalled"],
        "elapsedMs": elapsed_ms,
        "acceptedExamplesPerMinute": (
            round(accepted_examples / elapsed_minutes, 2)
            if elapsed_minutes
            else 0
        ),
        "lastBatch": report["batches"][-1] if report["batches"] else None,
        "recentBatches": report["batches"][-5:],
    }
    if error:
        snapshot["error"] = error
    return snapshot


def write_progress(
    *,
    args,
    report: dict,
    started_at: float,
    current_count: int,
    remaining_tasks: int,
    status: str,
    error: str | None = None,
) -> None:
    write_json_atomic(
        args.progress,
        progress_snapshot(
            args=args,
            report=report,
            started_at=started_at,
            current_count=current_count,
            remaining_tasks=remaining_tasks,
            status=status,
            error=error,
        ),
    )


def llm_task_payload(task: dict, task_id: str) -> dict:
    return {
        "taskId": task_id,
        "kind": task["kind"],
        "scope": task["scope"],
        "examplesNeeded": task["examplesNeeded"],
        "target": task["target"],
        "routeCount": len(task["relevantRouteIds"]),
        "approvedRoutes": task["approvedRoutes"],
        "contrastRoutes": task["contrastRoutes"],
        "metadataBoundary": (
            "The approvedRoutes metadata is the only source of meaning. Generate query wording "
            "that a user might type for that metadata, but do not infer extra aviation or weather "
            "concepts from general knowledge."
        ),
        "instructions": task["instructions"],
    }


def generate_batch(args, tasks: list[dict], seed: int) -> tuple[dict[str, list[str]], dict]:
    max_examples = max(task["examplesNeeded"] for task in tasks)
    llm_task_ids = {
        f"task-{index + 1}": task["taskId"]
        for index, task in enumerate(tasks)
    }
    schema = {
        "type": "object",
        "properties": {
            "tasks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "taskId": {"type": "string"},
                        "queries": {
                            "type": "array",
                            "items": {"type": "string"},
                            "minItems": 1,
                            "maxItems": max_examples,
                        },
                    },
                    "required": ["taskId", "queries"],
                },
                "minItems": 1,
                "maxItems": len(tasks),
            }
        },
        "required": ["tasks"],
    }
    messages = [
        {
            "role": "system",
            "content": (
                "You generate synthetic expert-seed training queries for an aviation route "
                "navigation model. Labels are fixed by the supplied task; never invent route IDs, "
                "never output URLs, never mention internal route IDs, and never answer the query. "
                "Treat the supplied route metadata as a hard boundary: use only concepts, products, "
                "variables, locations, time meanings, and presentation types that appear in the "
                "approved route metadata or task instructions. Do not add plausible related ideas "
                "from general weather or aviation knowledge, such as probability, chance, risk, "
                "confidence, percentages, rainfall, thunderstorms, wind shear, runway impact, "
                "or alerts unless those concepts appear in the approved metadata. Write realistic "
                "user inputs with varied wording: fragments, questions, commands, abbreviations, "
                "and light typos only when meaning remains clear. For single tasks, do not ask for "
                "all/every/complete data. For multiple tasks, clearly ask for a set of related "
                "pages. Return only the required JSON."
            ),
        },
        {
            "role": "user",
            "content": json.dumps(
                {
                    "task": "Generate distinct queries for each fixed-label task.",
                    "tasks": [
                        llm_task_payload(task, llm_task_id)
                        for llm_task_id, task in zip(llm_task_ids, tasks)
                    ],
                },
                ensure_ascii=True,
            ),
        },
    ]
    result, metrics = call_ollama(
        url=args.ollama_url,
        model=args.model,
        messages=messages,
        schema=schema,
        temperature=0.65,
        num_predict=max(
            args.minimum_num_predict,
            sum(task["examplesNeeded"] for task in tasks) * args.num_predict_per_example
            + (len(tasks) * 20),
        ),
        timeout_seconds=args.timeout_seconds,
        retries=args.retries,
        seed=seed,
        num_ctx=args.num_ctx,
    )
    response_tasks = result.get("tasks")
    if not isinstance(response_tasks, list):
        raise ValueError("Ollama response did not contain a tasks array.")
    by_task_id = {}
    expected_llm_task_ids = set(llm_task_ids)
    for response_task in response_tasks:
        if not isinstance(response_task, dict):
            continue
        task_id = str(response_task.get("taskId", "")).strip()
        if task_id not in expected_llm_task_ids:
            continue
        by_task_id[llm_task_ids[task_id]] = unique_strings(response_task.get("queries", []))
    return by_task_id, metrics


def semantic_validation(
    args,
    task: dict,
    candidates: list[str],
    seed: int,
) -> tuple[list[str], dict]:
    if not candidates:
        return [], {"skipped": True, "reason": "no-candidates-passed-deterministic-checks"}
    if args.skip_semantic_validation:
        return candidates, {"skipped": True}

    schema = {
        "type": "object",
        "properties": {
            "acceptedIndexes": {
                "type": "array",
                "items": {"type": "integer", "minimum": 0, "maximum": max(0, len(candidates) - 1)},
                "uniqueItems": True,
            }
        },
        "required": ["acceptedIndexes"],
    }
    messages = [
        {
            "role": "system",
            "content": (
                "You are a strict metadata-bound semantic reviewer for aviation navigation "
                "training data. Accept a candidate only if every important concept in the query is "
                "supported by the approved route metadata for this fixed-label task. Reject queries "
                "that add unstated weather variables, probabilities, likelihoods, risk, confidence, "
                "percentages, hazards, alerts, runway effects, locations, time ranges, products, or "
                "operational meanings unless those ideas appear in approvedRoutes or task "
                "instructions. Reject queries that better match a contrast route, change "
                "single-versus-multiple scope, or are merely plausible from general knowledge. When "
                "uncertain, reject. Return only indexes from the supplied candidate list."
            ),
        },
        {
            "role": "user",
            "content": json.dumps(
                {
                    "task": "Review candidate queries for this fixed-label metadata task.",
                    "taskId": task["taskId"],
                    "kind": task["kind"],
                    "requiredScope": task["scope"],
                    "target": task["target"],
                    "approvedRoutes": task["approvedRoutes"],
                    "contrastRoutes": task["contrastRoutes"],
                    "instructions": task["instructions"],
                    "candidates": [
                        {"index": index, "query": candidate}
                        for index, candidate in enumerate(candidates)
                    ],
                },
                ensure_ascii=True,
            ),
        },
    ]
    result, metrics = call_ollama(
        url=args.ollama_url,
        model=args.validator_model,
        messages=messages,
        schema=schema,
        temperature=0,
        num_predict=max(180, len(candidates) * 10),
        timeout_seconds=args.timeout_seconds,
        retries=args.retries,
        seed=seed,
        num_ctx=args.num_ctx,
    )
    indexes = result.get("acceptedIndexes")
    if not isinstance(indexes, list):
        raise ValueError("Ollama validation response did not contain acceptedIndexes.")
    accepted_indexes = {
        index
        for index in indexes
        if isinstance(index, int) and 0 <= index < len(candidates)
    }
    return [
        candidate for index, candidate in enumerate(candidates) if index in accepted_indexes
    ], metrics


def deterministic_rejection_reason(query: str, task: dict, valid_route_ids: set[str]) -> str | None:
    normalized = normalize_query(query)
    words = normalized.split()
    if not normalized:
        return "empty-query"
    if len(query) > 240 or len(words) > 40:
        return "query-too-long"
    if URL_PATTERN.search(query):
        return "contains-url"
    internal_style_route_ids = [
        route_id for route_id in valid_route_ids if re.search(r"[-_/]", route_id)
    ]
    if any(route_id.lower() in query.lower() for route_id in internal_style_route_ids):
        return "contains-internal-route-id"
    asks_for_multiple = bool(MULTIPLE_PATTERN.search(normalized))
    if task["scope"] == "single" and asks_for_multiple:
        return "single-task-asks-for-multiple"
    if task["scope"] == "multiple" and not asks_for_multiple:
        return "multiple-task-does-not-ask-for-a-set"
    return None


def record_for_query(query: str, task: dict, fingerprint: str, generated_at: str, model: str) -> dict:
    return {
        "query": query,
        "scope": task["scope"],
        "relevantRouteIds": sorted(set(task["relevantRouteIds"])),
        "source": task["source"],
        "syntheticTaskId": task["taskId"],
        "generatorModel": model,
        "registryFingerprint": fingerprint,
        "generatedAt": generated_at,
    }


def retained_existing_records(
    output_path: Path,
    valid_route_ids: set[str],
    fingerprint: str,
) -> list[dict]:
    records = []
    for record in read_jsonl(output_path):
        validate_training_record(record, valid_route_ids, str(output_path))
        if record.get("registryFingerprint") == fingerprint:
            records.append(record)
    return records


def main() -> None:
    args = parse_args()
    if args.target_count < 1:
        raise ValueError("--target-count must be at least 1.")
    if args.tasks_per_call < 1:
        raise ValueError("--tasks-per-call must be at least 1.")
    for argument_name in (
        "contrast_route_limit",
        "group_route_context_limit",
        "route_topic_limit",
        "route_purpose_limit",
        "route_phrase_limit",
        "plain_keyword_limit",
        "minimum_num_predict",
        "num_predict_per_example",
        "num_ctx",
    ):
        if getattr(args, argument_name) < 1:
            raise ValueError(f"--{argument_name.replace('_', '-')} must be at least 1.")

    routes = load_registry(args.registry)
    valid_route_ids = {route["id"] for route in routes}
    fingerprint = registry_fingerprint(routes)
    reference_index = build_reference_index(args.reference_data, valid_route_ids)
    existing_records = retained_existing_records(args.output, valid_route_ids, fingerprint)
    output_index = {
        normalize_query(record["query"]): label_key(record["scope"], record["relevantRouteIds"])
        for record in existing_records
    }
    tasks = order_tasks(build_tasks(routes, args), args.task_order)
    planned_examples = sum(task["examplesNeeded"] for task in tasks)
    created_at = utc_timestamp()
    report = {
        "schemaVersion": 1,
        "generatedAt": created_at,
        "generatorModel": args.model,
        "validatorModel": None if args.skip_semantic_validation else args.validator_model,
        "ollamaUrl": args.ollama_url,
        "registryFingerprint": fingerprint,
        "targetCount": args.target_count,
        "existingExamplesRetained": len(existing_records),
        "plannedTasks": len(tasks),
        "plannedExamples": planned_examples,
        "plannedBySource": task_plan(tasks),
        "taskOrder": args.task_order,
        "tasksPerCall": args.tasks_per_call,
        "numCtx": args.num_ctx,
        "minimumNumPredict": args.minimum_num_predict,
        "numPredictPerExample": args.num_predict_per_example,
        "includeDescriptions": args.include_descriptions,
        "semanticValidationEnabled": not args.skip_semantic_validation,
        "batchesCalled": 0,
        "acceptedExamples": 0,
        "deterministicallyRejected": 0,
        "semanticallyRejected": 0,
        "nearDuplicatesRejected": 0,
        "duplicateTrainingQueriesRejected": 0,
        "missingTaskResponses": 0,
        "batches": [],
    }

    if args.dry_run:
        print(json.dumps(report, indent=2, ensure_ascii=True))
        print("Dry run complete; Ollama was not called and no files were written.")
        return

    generated_records = list(existing_records)
    current_count = len(generated_records)
    task_queue = list(tasks)
    batch_index = 0
    run_started_at = time.perf_counter()
    active_batch_task_count = 0
    write_progress(
        args=args,
        report=report,
        started_at=run_started_at,
        current_count=current_count,
        remaining_tasks=len(task_queue),
        status="running",
    )

    try:
        while task_queue and current_count < args.target_count:
            batch_tasks = task_queue[: args.tasks_per_call]
            task_queue = task_queue[args.tasks_per_call :]
            active_batch_task_count = len(batch_tasks)
            batch_index += 1
            started_at = time.perf_counter()
            candidates_by_task_id, metrics = generate_batch(
                args,
                batch_tasks,
                args.seed + batch_index,
            )
            report["batchesCalled"] += 1

            batch_report = {
                "taskIds": [task["taskId"] for task in batch_tasks],
                "candidateQueries": 0,
                "acceptedQueries": 0,
                "generationMetrics": metrics,
                "durationMs": round((time.perf_counter() - started_at) * 1000, 2),
            }

            for task in batch_tasks:
                expected_label = label_key(task["scope"], task["relevantRouteIds"])
                candidates = candidates_by_task_id.get(task["taskId"], [])
                if not candidates:
                    report["missingTaskResponses"] += 1
                    continue
                batch_report["candidateQueries"] += len(candidates)
                deterministic_candidates = []
                for candidate in candidates:
                    reason = deterministic_rejection_reason(candidate, task, valid_route_ids)
                    if reason:
                        report["deterministicallyRejected"] += 1
                        continue
                    deterministic_candidates.append(candidate)

                existing_same_label_queries = [
                    record["query"]
                    for record in generated_records
                    if label_key(record["scope"], record["relevantRouteIds"]) == expected_label
                ]
                deterministic_candidates, near_duplicate_count = remove_near_duplicates(
                    deterministic_candidates,
                    existing_same_label_queries,
                )
                report["nearDuplicatesRejected"] += near_duplicate_count
                before_validation_count = len(deterministic_candidates)
                deterministic_candidates, validation_metrics = semantic_validation(
                    args,
                    task,
                    deterministic_candidates,
                    args.seed + batch_index + len(task["taskId"]),
                )
                report["semanticallyRejected"] += (
                    before_validation_count - len(deterministic_candidates)
                )
                batch_report.setdefault("validationMetrics", {})[
                    task["taskId"]
                ] = validation_metrics

                for candidate in deterministic_candidates:
                    normalized = normalize_query(candidate)
                    known_label = reference_index.get(normalized) or output_index.get(normalized)
                    if known_label:
                        report["duplicateTrainingQueriesRejected"] += 1
                        if known_label != expected_label:
                            continue
                        continue
                    record = record_for_query(candidate, task, fingerprint, created_at, args.model)
                    generated_records.append(record)
                    output_index[normalized] = expected_label
                    current_count += 1
                    batch_report["acceptedQueries"] += 1
                    report["acceptedExamples"] += 1
                    if current_count >= args.target_count:
                        break
                if current_count >= args.target_count:
                    break

            report["batches"].append(batch_report)
            active_batch_task_count = 0
            write_progress(
                args=args,
                report=report,
                started_at=run_started_at,
                current_count=current_count,
                remaining_tasks=len(task_queue),
                status="running",
            )
    except Exception as error:
        write_progress(
            args=args,
            report=report,
            started_at=run_started_at,
            current_count=current_count,
            remaining_tasks=len(task_queue) + active_batch_task_count,
            status="failed",
            error=str(error),
        )
        raise

    try:
        generated_records.sort(
            key=lambda record: (
                str(record.get("source", "")),
                str(record.get("syntheticTaskId", "")),
                normalize_query(record["query"]),
            )
        )
        report["totalOutputExamples"] = len(generated_records)
        write_jsonl_atomic(args.output, generated_records)
        write_json_atomic(args.manifest, report)
        write_progress(
            args=args,
            report=report,
            started_at=run_started_at,
            current_count=len(generated_records),
            remaining_tasks=len(task_queue),
            status="complete",
        )
    except Exception as error:
        write_progress(
            args=args,
            report=report,
            started_at=run_started_at,
            current_count=current_count,
            remaining_tasks=len(task_queue),
            status="failed",
            error=str(error),
        )
        raise
    print(
        f"Synthetic expert seed: accepted={report['acceptedExamples']} "
        f"total={report['totalOutputExamples']} target={args.target_count}"
    )
    print(f"Training data: {args.output.resolve()}")
    print(f"Generation manifest: {args.manifest.resolve()}")
    print(f"Live progress: {args.progress.resolve()}")


if __name__ == "__main__":
    main()
