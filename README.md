# AMIDS PyTorch Route Ranker

This service is a small trainable AI model specialised for two decisions:

1. Which approved `routeRegistry` entries best match a user's request?
2. Does the user want one route or multiple related routes?

It is not a generative chatbot. It scores every approved registry route in one
PyTorch batch and normally returns only IDs, confidence, and scope. The Node
gateway remains the security boundary: it validates returned IDs and retrieves
the authoritative paths from `src/data/routeRegistry.js`.

## Architecture

```text
React UI
  -> Node AMIDS assistant gateway :3001
     -> PyTorch route ranker :8001
        -> lexical relevance model scores all approved routes
        -> optional local sentence encoder scores semantic similarity
        -> configured fusion combines both route scores
        -> scope model predicts single or multiple
     -> Node validates IDs against routeRegistry
     -> hybrid mode sends uncertain requests to Qwen
```
The base ranker uses hashed word/character n-gram features and a small neural
pair-ranking network. An optional local sentence encoder can add semantic
query-route similarity while preserving the base model for exact terminology
and spelling robustness. Runtime routing never downloads encoder weights.

## 1. Create The Python Environment

Python 3.11 is a conservative choice for the Windows workplace machine.

Windows PowerShell:

```powershell
py -3.11 -m venv pytorch_route_ranker\.venv
pytorch_route_ranker\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r pytorch_route_ranker\requirements.txt
```

macOS/Linux:

```bash
python3 -m venv pytorch_route_ranker/.venv
source pytorch_route_ranker/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r pytorch_route_ranker/requirements.txt
```

Install the optional semantic dependencies only when semantic routing is required:

```bash
python -m pip install -r pytorch_route_ranker/requirements-semantic.txt
```

For an offline workplace network, download approved Python wheels on an
approved connected machine, scan them, move them through the organisation's
approved transfer process, and install from an internal wheel directory:

```powershell
python -m pip install --no-index --find-links C:\approved-wheelhouse -r pytorch_route_ranker\requirements.txt
```

## Optional Local Semantic Encoder

On an approved connected machine, prepare a local encoder directory:

```bash
npm run ranker:prepare-semantic-encoder -- \
  --model sentence-transformers/all-MiniLM-L6-v2
```

This command downloads the selected model once and saves it under
`pytorch_route_ranker/models/semantic_encoder`. For a disconnected workplace,
prepare and scan that directory externally, transfer it through the approved
process, and place it at the same path. To import an already downloaded model
without network access:

```bash
npm run ranker:prepare-semantic-encoder -- \
  --model /path/to/approved/local/model \
  --local-files-only
```

Enable semantic fusion before starting the ranker:

```bash
export AMIDS_SEMANTIC_ENCODER_PATH="$PWD/pytorch_route_ranker/models/semantic_encoder"
export AMIDS_SEMANTIC_DEVICE=cuda
export AMIDS_SEMANTIC_WEIGHT=1.0
npm run ranker:api
```

PowerShell equivalent:

```powershell
$env:AMIDS_SEMANTIC_ENCODER_PATH="$PWD\pytorch_route_ranker\models\semantic_encoder"
$env:AMIDS_SEMANTIC_DEVICE="cuda"
$env:AMIDS_SEMANTIC_WEIGHT="1.0"
npm run ranker:api
```

If `AMIDS_SEMANTIC_ENCODER_PATH` is absent, the service keeps its previous
lexical-only behavior. If it is present, the path must be a local directory and
the service loads with `local_files_only=True`. Route embeddings are calculated
once at startup. Each `/rank` response exposes the fused `score`, plus
`lexicalScore`, `semanticScore`, `scoringMode`, and `semanticModelVersion` for
auditing. Semantic cosine similarity is clipped to `[0, 1]` before weighted
fusion; negative similarity contributes zero.

`AMIDS_SEMANTIC_WEIGHT` must be between `0` and `1`. The default is `1.0`, so a
configured encoder uses semantic-only route scoring. Set it to `0` for the
lexical baseline or an intermediate value for a later fusion experiment.

Semantic-only routing uses raw clipped cosine similarity for ranking, then maps
absolute support and route separation into an experimental operational
confidence. It does not use the lexical confidence heuristic. The initial
settings are:

```text
AMIDS_SEMANTIC_MINIMUM_SIMILARITY=0.45
AMIDS_SEMANTIC_CONFIDENCE_FLOOR=0.20
AMIDS_SEMANTIC_STRONG_SIMILARITY=0.55
AMIDS_SEMANTIC_MINIMUM_CONFIDENCE=0.80
AMIDS_SEMANTIC_SINGLE_MARGIN=0.08
AMIDS_SEMANTIC_CLUSTER_BAND=0.10
AMIDS_SEMANTIC_CLUSTER_GAP=0.10
AMIDS_SEMANTIC_SCOPE_MULTIPLE_THRESHOLD=0.58
AMIDS_SEMANTIC_SCOPE_MINIMUM_CONFIDENCE=0.55
```

For a single route, absolute support scales the top similarity from zero at
`CONFIDENCE_FLOOR` to one at `STRONG_SIMILARITY`. Separation support scales the
top-to-second margin against `SINGLE_MARGIN`. Confidence is the geometric mean
of those values. For a multiple-route result, separation is treated as
satisfied and absolute support uses the weakest selected route. Raw similarity
must still meet `MINIMUM_SIMILARITY`, and mapped confidence must meet
`MINIMUM_CONFIDENCE`.

Semantic-only scope is decided by a lightweight classifier. High-confidence
linguistic guards still handle explicit requests such as "all wind pages" or
"only one route". When the wording is not explicit, the classifier uses the
semantic score distribution: top-to-second margin, number of routes above
`MINIMUM_SIMILARITY`, and the size of the coherent cluster that remains within
`CLUSTER_BAND` and before an adjacent `CLUSTER_GAP`. It predicts multiple routes
when that evidence exceeds `AMIDS_SEMANTIC_SCOPE_MULTIPLE_THRESHOLD`; otherwise
it keeps the request single-route. If classifier confidence drops below
`AMIDS_SEMANTIC_SCOPE_MINIMUM_CONFIDENCE`, the API marks the scope as uncertain
so the UI can ask for clarification instead of opening routes automatically.

An explicit multiple request still selects the qualifying semantic cluster, with
a maximum of eight routes. Explicit single-route wording never triggers cluster
expansion. The response exposes mapped route confidence, top semantic
similarity, score margin, scope-decision source, scope confidence, and scope
signals for inspection. Tune these values on development data and evaluate the
frozen policy once on the untouched held-out set. These mapped confidence values
are not statistically calibrated probabilities.

### Live Routing Diagnostics

Enable internal scorer comparisons only for a controlled reviewer or developer
session:

```bash
export AMIDS_RANKER_DIAGNOSTICS=true
npm run ranker:api
```

With the Node gateway in `pytorch` or `hybrid` mode, the assistant result then
shows a collapsed **Routing diagnostics** panel. It displays:

- the lexical, semantic, and fused top-eight rankings;
- each scorer's independently selected route set;
- configured lexical and semantic weights;
- whether the semantic scorer changed the lexical top route or selected set;
- lexical and semantic weighted contributions for final selected routes;
- scope probability, scope confidence, scope signals, and any explicit scope
  constraint.

The comparison reuses scores already calculated for routing and does not make
additional model calls. Restart the ranker after changing the diagnostics flag,
and restart the Node gateway if it may contain cached results from before the
flag was enabled. Leave diagnostics disabled for ordinary users because the
payload exposes internal rankings and personalization-influenced lexical scores.

### Calibrate Single-Route Confidence

The confidence calibrator is optional and disabled by default. The normal
semantic-only experiment uses direct clipped cosine support. If a later
deployment requires an empirically calibrated correctness probability, fit the
lightweight confidence calibrator on a dedicated,
reviewer-approved calibration set so the single-route confidence answers the
specific question: "How often is this selected top route correct?"

Do not use the final `held_out_test.jsonl` to fit the calibrator. Keep three
separate data roles:

1. training data fits the lexical ranker;
2. calibration data fits confidence after the ranker and semantic weight are fixed;
3. untouched held-out data measures the completed system once.

The calibration JSONL uses the same `query`, `scope`, and `relevantRouteIds`
format as evaluation data. It should represent realistic production wording
and must contain both correct and incorrect single-route predictions. A few
hundred reviewed examples is a practical starting point; 500-2,000 is safer
when route categories are varied.

With the semantic model already prepared, run:

```bash
npm run ranker:calibrate-confidence -- \
  --data path/to/confidence_calibration.jsonl \
  --semantic-encoder pytorch_route_ranker/models/semantic_encoder \
  --semantic-device cuda \
  --semantic-weight 1.0
```

The command writes
`pytorch_route_ranker/models/semantic_confidence_calibrator.json`. The ranker
does not load it automatically. Opt in by setting
`AMIDS_CONFIDENCE_CALIBRATOR_PATH` to that artifact. Leave the variable absent
or set it to `off` to keep the experimental semantic confidence mapping.

The command reports the old heuristic and calibrated validation Brier scores,
expected calibration error, automatic-navigation coverage, and accuracy among
accepted decisions. Lower Brier score and calibration error are better. Do not
promote a calibrator merely because it increases coverage; accepted-route
accuracy must remain appropriate for the operational risk.
`--decision-threshold` changes only this calibration report. For semantic-only
routing, set the chosen runtime threshold separately with
`AMIDS_SEMANTIC_MINIMUM_CONFIDENCE`, then verify the complete configuration once
against the untouched held-out set.

The artifact is bound to the exact route-registry fingerprint, ranker model
version, semantic model version, and semantic weight. Refit it whenever any of
those change. An incompatible artifact is rejected at startup instead of being
silently applied. The calibrator currently applies only to single-route top
selection. Multiple-route set confidence and single-versus-multiple scope keep
their existing logic and require separate calibration work.

After opting in, restart `npm run ranker:api`. `/health` reports whether the
calibrator loaded, and the Routing diagnostics screen shows the calibrated
probability beside the direct semantic-support value.

## 2. Export The Approved Registry

Run this whenever `src/data/routeRegistry.js` changes:

```bash
npm run ranker:export
```

The model refuses to start when its checkpoint was trained against a different
registry version. This prevents stale models from returning removed route IDs.

## 3. Prepare Training Examples

Generate initial examples from route titles, descriptions, and structured
keywords:

```bash
npm run ranker:generate
```

The generator deliberately creates several language styles:

```text
Command:   open Radar Satellite Composite
Fragment:  Radar Satellite Composite
Polite:    Radar Satellite Composite please
Search:    looking for Radar Satellite Composite
Question:  where can I find Radar Satellite Composite
Broad:     radar data
Broad:     everything related to radar
Conversational: do we have runway wind impact
Conversational: trying to check current wind obs
Typo:      currnet wind observations
Typo:      runwaywind impact
```

Keywords may encode route semantics without changing the five-field registry
shape:

```json
"keywords": [
  "topic:wind",
  "purpose:live-status",
  "route:winds around HKIA",
  "crosswind"
]
```

Bare shared `topic:` values such as `radar` are labelled as multiple-route
requests, while `route:` values, route titles, and sufficiently distinguishing
plain keywords are labelled as single-route requests. The generator removes a
query entirely if two generation rules assign it contradictory expected answers.

Generated examples include a `source` value such as
`generated-route-fragment`, `generated-topic-conversational`, or a source
ending in `-typo`. These labels make it possible to audit whether the dataset
is overly dominated by one language style.

The default generator creates reproducible conversational and typo-augmented
examples from confidently labelled clean examples. Scope-bearing words such as
`all`, `every`, and `complete` are protected from typo mutation. Typo variants
that collide with a different label are discarded instead of removing or
overwriting clean examples.

The generator can also create a larger wording pool and then keep a seeded,
style-balanced subset. This is useful when the raw generated file becomes large
but still feels repetitive. Single-route sampling uses approximate style quotas:
command, fragment, conversational, contrastive, and typo/shorthand. The seed
controls which examples are kept, so model experiments can reuse exactly the
same generated data while changing only training parameters.

Control the augmentation volume and reproduce a run with:

```bash
npm run ranker:generate -- \
  --seed 42 \
  --random-variants-per-anchor 4 \
  --typo-variants-per-example 1 \
  --max-typos 1
```

Generate a richer but capped normal dataset with:

```bash
npm run ranker:generate -- \
  --seed 42 \
  --random-variants-per-anchor 8 \
  --typo-variants-per-example 1 \
  --max-typos 1 \
  --contrast-routes-per-route 2 \
  --max-single-examples-per-route 80 \
  --max-multiple-examples-per-route-set 35
```

Normal generated data is the base layer, so cross-file duplicate checks are
off by default. In a clean rebuild, run this command first, then generate
synthetic expert, hard, and held-out data afterward so those later stages check
against the generated base. If you are regenerating normal data after other
datasets already exist and want the older defensive behavior, add:

```bash
--use-default-reference-data
```

While normal generation runs, it prints stage updates and atomically refreshes:

```text
pytorch_route_ranker/data/generated_training_examples_progress.json
```

That file shows the current stage, elapsed time, examples generated so far,
reference rejections, and sampling status. Use `--progress path/to/progress.json`
to choose another location, `--progress-interval 10` for more frequent updates,
or `--quiet-progress` to write only the JSON file without terminal stage logs.

Use `--base-only` to recreate only the original clean template dataset. Avoid
large typo counts: one realistic typo per query usually teaches robustness
better than heavily corrupted text. Highly ambiguous natural requests still
need expert review or the approved hard-example pipeline.

`npm run ranker:experiment` passes its training seed into this generator by
default and records the generation settings in the run configuration. Use a
separate generation seed or adjust the augmentation volume when comparing
datasets:

```bash
npm run ranker:experiment -- \
  --generation-seed 108 \
  --random-variants-per-anchor 6 \
  --typo-variants-per-example 1 \
  --max-typos 1 \
  --max-single-examples-per-route 80 \
  --max-multiple-examples-per-route-set 35
```

Add `--use-default-reference-data-generation` only when you deliberately want
`ranker:experiment` to generate normal data with cross-file duplicate checks.

Keep a clean held-out test set plus a smaller human-reviewed typo and shorthand
test set. Never evaluate only on synthetic noise produced by the same
generator, because that can overstate real-world robustness.

Add expert-reviewed cases to:

```text
pytorch_route_ranker/data/expert_training_examples.jsonl
```

Each line has this shape:

```json
{"query":"show all runway wind data","scope":"multiple","relevantRouteIds":["wind-overview","wind-current-observations"],"source":"expert-reviewed"}
```

Real AMIDS route IDs do not need to follow the prototype's suffix convention.
For example, `radar-satellite-composite` is valid. Do not rename real AMIDS IDs
solely for AI training; IDs are system identifiers and should remain stable.
Because the registry stays limited to `id`, `title`, `path`, `description`, and
`keywords`, encode topic and purpose distinctions inside `keywords`.

For example:

```json
{
  "id": "radar-satellite-composite",
  "title": "Radar Satellite Composite",
  "path": "https://internal-amids.example/radar-composite",
  "description": "Combined radar and satellite imagery.",
  "keywords": [
    "topic:radar",
    "topic:satellite",
    "topic:imagery",
    "purpose:multi-source-composite",
    "route:radar satellite composite",
    "composite imagery"
  ]
}
```

Here, generated broad queries such as `show all radar data` can group it with
other routes that also contain `topic:radar`, while
`route:radar satellite composite` creates single-route examples for the
specific page. Review broad generated groups carefully and describe
operationally important groupings explicitly in `expert_training_examples.jsonl`.

Use the exact routes an aviation expert expects. Add difficult phrases,
paraphrases, abbreviations, exclusions, and examples where similar wording
should produce different results. Do not train automatically from a merely
`helpful` click; collect a corrected expected route selection first.

### Generate Synthetic Expert-Seed Examples

When true expert-reviewed examples are not available yet, you can create a
separate synthetic seed dataset from the current route registry using local
Ollama:

```bash
npm run ranker:export
npm run ranker:generate-synthetic-expert -- --target-count 2000
```

The output is written to:

```text
pytorch_route_ranker/data/synthetic_expert_seed_examples.jsonl
pytorch_route_ranker/data/synthetic_expert_seed_manifest.json
pytorch_route_ranker/data/synthetic_expert_seed_progress.json
pytorch_route_ranker/data/synthetic_expert_seed_checkpoint.json
```

These files are ignored by Git because they may contain internal wording. The
examples are included by default when running `npm run ranker:train` and are
snapshotted by `npm run ranker:experiment`.

After every completed Ollama batch, the generator atomically updates the JSONL,
progress file, and resumable checkpoint. The checkpoint records the completed
task IDs, batch index, elapsed time, configuration signature, and accumulated
run report. If the process, terminal, or machine stops, rerun the exact same
command: a compatible `running` or `failed` checkpoint is loaded automatically
and completed tasks are skipped. The checkpoint is deleted after successful
completion.

Use `synthetic_expert_seed_progress.json` to watch `status`,
`acceptedExamples`, `totalOutputExamples`, `completedTasks`, `remainingTasks`,
`elapsedMs`, `acceptedExamplesPerMinute`, and recent batch timing. The final
manifest remains the authoritative completed-run report. Use `--no-resume` to
ignore an interrupted checkpoint deliberately; existing JSONL records are still
retained unless that output file is separately removed or replaced.

The local LLM does **not** choose route IDs. The script builds fixed-label
tasks from `routeRegistry` and asks Ollama only to write natural user queries.
It then rejects invalid route IDs, URLs, internal route IDs, duplicate queries,
single-route examples that ask for `all` data, and multiple-route examples that
do not clearly ask for a set. This keeps the LLM as a language generator rather
than the authority on labels.

Preview the generation plan without calling Ollama:

```bash
npm run ranker:generate-synthetic-expert -- --dry-run
```

Use a smaller local model or different target count when testing:

```bash
SYNTHETIC_EXPERT_LLM_MODEL=qwen3:0.6b \
npm run ranker:generate-synthetic-expert -- \
  --target-count 300 \
  --tasks-per-call 4
```

Windows PowerShell:

```powershell
$env:SYNTHETIC_EXPERT_LLM_MODEL="qwen3:0.6b"
npm run ranker:generate-synthetic-expert -- --target-count 300 --tasks-per-call 4
```

For a 2,000-example target, expect many local model calls. On CPU-only
hardware, run it in batches and inspect the progress file during the run, then
inspect the manifest after each run. Treat this file as `synthetic-expert-seed`,
not `expert-reviewed`, until a human has reviewed or sampled it.

For slower local models such as `qwen3:0.6b`, use a smaller, faster batch:

```bash
SYNTHETIC_EXPERT_LLM_MODEL=qwen3:0.6b \
npm run ranker:generate-synthetic-expert -- \
  --target-count 300 \
  --tasks-per-call 6 \
  --single-examples-per-route 3 \
  --hard-examples-per-route 1 \
  --topic-examples-per-group 3 \
  --purpose-examples-per-group 1 \
  --minimum-num-predict 220 \
  --num-predict-per-example 14 \
  --num-ctx 1536
```

The generator excludes route descriptions from the prompt by default to keep
Ollama prompt evaluation faster. Add `--include-descriptions` only if the
generated wording is too shallow. The default task order is balanced, so a
small target count still samples single-route, hard-distinction, topic, and
purpose tasks instead of spending the whole run on only the first source type.

### Generate Held-Out Test Candidates

When handwritten held-out examples are too slow to produce, generate a separate
candidate queue for human review:

```bash
npm run ranker:export
npm run ranker:generate-heldout-candidates -- \
  --model mistral-nemo:12b \
  --target-count 800 \
  --tasks-per-call 2
```

The output is written to:

```text
pytorch_route_ranker/data/held_out_candidates.jsonl
pytorch_route_ranker/data/held_out_candidates_manifest.json
pytorch_route_ranker/data/held_out_candidates_progress.json
```

These candidates are **not training data** and should not be included by
`ranker:train`. Each candidate keeps the standard evaluation fields
`query`, `scope`, and `relevantRouteIds`, plus review metadata such as
`candidateStatus`, `source`, `generatorModel`, and `registryFingerprint`.

The generator audits every candidate against:

```text
pytorch_route_ranker/data/generated_training_examples.jsonl
pytorch_route_ranker/data/synthetic_expert_seed_examples.jsonl
pytorch_route_ranker/data/expert_training_examples.jsonl
pytorch_route_ranker/data/hard_example_training_data.jsonl
pytorch_route_ranker/data/held_out_test.jsonl
```

It rejects exact normalized duplicates, conflicting labels, invalid route IDs,
obvious single/multiple scope mistakes, and near duplicates above
`--near-duplicate-threshold` before writing candidates. Use `--dry-run` to
preview the plan without calling Ollama:

```bash
npm run ranker:generate-heldout-candidates -- --dry-run
```

After generation, a human reviewer should copy only approved records into the
frozen `held_out_test.jsonl`, keeping `query`, `scope`, `relevantRouteIds`, and
any useful evaluation metadata such as `categories` or `critical`. Never train
on `held_out_candidates.jsonl` or `held_out_test.jsonl`.

### Generate Scope-Focused Test Candidates

Use this when the semantic encoder or lightweight scope classifier needs a
targeted test set for single-versus-multiple decisions:

```bash
npm run ranker:export
npm run ranker:generate-scope-test -- \
  --model gemma3:27b \
  --validator-model qwen3:30b \
  --target-count 400 \
  --tasks-per-call 2 \
  --seed 42
```

The output is written to:

```text
pytorch_route_ranker/data/scope_focused_test_candidates.jsonl
pytorch_route_ranker/data/scope_focused_test_manifest.json
pytorch_route_ranker/data/scope_focused_test_progress.json
```

These are reviewable test candidates, not training data. The generator creates
four scope-focused task types:

- single-route queries where words like `complete`, `full`, `overview`, or
  `comprehensive` still mean one page;
- single combined-product queries where words like `and`, `combined`, or
  `composite` still mean one page;
- multiple-topic queries where the user clearly wants several related pages;
- multiple bundle queries where the user asks for two separate pages together.

Like held-out generation, the command accumulates candidates safely: it keeps
same-registry existing records, rejects duplicates and near duplicates against
training and held-out references, and treats `--target-count` as the final
desired total. If 200 candidates already exist and you want about 200 more, run
with `--target-count 400`.

Useful small test:

```bash
npm run ranker:generate-scope-test -- \
  --target-count 80 \
  --tasks-per-call 2 \
  --single-trap-examples-per-route 1 \
  --combined-product-examples-per-route 1 \
  --topic-examples-per-group 1 \
  --bundle-examples-per-pair 1 \
  --candidate-multiplier 3
```

After review, copy approved scope candidates into the held-out/evaluation file
you use for classifier tuning. Keep them out of `ranker:train`.

### Reviewable Interaction Evidence

Every new clarification response is automatically exported to:

```text
pytorch_route_ranker/data/reviewable_interaction_evidence.jsonl
```

The file is a pending-review queue, not training data. A selected route is
stored as a proposed label that must be verified. A `none-match` response is
stored without proposed relevant routes so a reviewer can assign the correct
answer. User IDs are deliberately excluded, and the file is ignored by Git
because queries may be confidential.

Run this command to backfill or rebuild missing queue entries from the current
personalization store:

```bash
npm run ranker:export-evidence
```

Each record includes `reviewStatus`, `reviewNotes`, `approvedScope`,
`approvedRelevantRouteIds`, and an append-only `reviewHistory`. The automatic
exporter preserves those fields on later exports. Use the human review UI to
approve a correction only after verifying its query, scope, and routes.
Approved corrections can be revoked with a required reason, edited, and
reapproved. The hard-example generator includes only records whose current
`reviewStatus` is `approved`.

The prototype now provides a local **Review evidence** screen in the main
header. It loads the review queue and current route registry from the local
assistant API. Select the semantically correct scope and route IDs, then click
**Approve correction**. The server automatically records `reviewedAt` using
the successful approval time in ISO 8601 format; reviewers do not need to type
the timestamp manually. An approved correction can be revoked from the same
screen by supplying a reason, then edited and reapproved. Later
`ranker:export-evidence` runs preserve the complete review history.

### Generate Active-Learning Failures And Hard Examples

The active-learning probe runner can generate difficult fixed-label queries,
test them against the currently running PyTorch ranker, and send only model
failures to the existing human review queue.

Start the trained ranker API in one terminal:

```bash
npm run ranker:api
```

Then run a probe cycle in another terminal:

```bash
npm run ranker:generate-failure-candidates -- \
  --model qwen3:32b \
  --validator-model gemma3:27b \
  --target-count 500 \
  --tasks-per-call 1 \
  --single-probes-per-route 8 \
  --topic-probes-per-group 8 \
  --purpose-probes-per-group 4 \
  --num-ctx 4096
```

The generator fixes the expected route label before asking the LLM for query
wording. It metadata-validates each query, calls the PyTorch `/rank` endpoint,
and retains cases involving wrong routes, missing routes, scope disagreement,
route-count disagreement, fallback, or high-confidence errors. Ranker transport
errors and registry-fingerprint mismatches stop the run instead of becoming
false training evidence.

Each completed batch atomically updates:

```text
pytorch_route_ranker/data/hard_failure_candidates.jsonl
pytorch_route_ranker/data/hard_failure_candidates_progress.json
pytorch_route_ranker/data/hard_failure_candidates_checkpoint.json
pytorch_route_ranker/data/reviewable_interaction_evidence.jsonl
```

Rerun the same command to resume a compatible interrupted checkpoint. Use
`--no-resume` only to discard the completed-task state deliberately. Do not
approve or mutate the review queue while a probe run is writing batches; review
the imported records after generation finishes.

The review UI marks these records as **Model failure** and shows the fixed
expected label, ranker prediction, confidence, model version, and failure
types. The reviewer can approve the proposed label, replace it using the full
registry, or dismiss the candidate. The eight predicted routes are diagnostic
context, not a restriction on the reviewer.

After reviewing candidates, continue with the normal hard-example command
below. Approved probe queries are stored as `approved-active-learning-failure`;
generated paraphrases remain `synthetic-hard-example`.

Approved interaction corrections can be expanded into a small, controlled set
of semantically equivalent training queries using a local Ollama model:

```bash
npm run ranker:export
npm run ranker:export-evidence
npm run ranker:generate-hard-examples
```

The first command refreshes `route_registry.json` from the actual
`routeRegistry.js`; the generator therefore uses the IDs, titles,
descriptions, and keywords from the active AMIDS registry. Route paths are
retained in the local registry but are never sent to the LLM.

The command reads only evidence records whose `reviewStatus` is `approved` and
whose `approvedScope` and `approvedRelevantRouteIds` are valid. The local LLM
is allowed to write paraphrases, but it is never allowed to choose or alter the
approved labels.

For each approved correction, the pipeline:

1. retains the original real failed query as an
   `approved-interaction-correction`;
2. asks the local LLM for 30 varied candidate paraphrases;
3. rejects candidates that change explicit single/multiple scope, lose
   important time or exclusion qualifiers, contain URLs or internal-style
   route IDs, or duplicate existing queries;
4. asks the local LLM a second time to strictly verify semantic equivalence;
5. retains at most 15 accepted `synthetic-hard-example` paraphrases.

Select a local model through an environment variable:

```bash
HARD_EXAMPLE_LLM_MODEL=qwen3:8b npm run ranker:generate-hard-examples
```

Optionally use a stronger local model for the semantic review pass:

```bash
HARD_EXAMPLE_LLM_MODEL=qwen3:1.7b \
HARD_EXAMPLE_VALIDATOR_MODEL=qwen3:8b \
npm run ranker:generate-hard-examples
```

Windows PowerShell:

```powershell
$env:HARD_EXAMPLE_LLM_MODEL="qwen3:8b"
npm run ranker:generate-hard-examples
```

Inspect the approved evidence and planned work without calling Ollama or
writing files:

```bash
npm run ranker:generate-hard-examples -- --dry-run
```

Process one correction or adjust the controlled limits:

```bash
npm run ranker:generate-hard-examples -- \
  --evidence-id correction-id \
  --generate-count 30 \
  --max-paraphrases 15
```

For larger local models or longer approved route metadata, increase the JSON
output budget so the model does not stop mid-string:

```bash
npm run ranker:generate-hard-examples -- \
  --model command-r:35b \
  --validator-model qwen3:30b \
  --generate-count 30 \
  --max-paraphrases 15 \
  --num-ctx 8192 \
  --minimum-num-predict 2200 \
  --num-predict-per-paraphrase 80 \
  --validation-minimum-num-predict 360 \
  --validation-num-predict-per-candidate 12 \
  --timeout-seconds 300 \
  --retries 5 \
  --seed 42
```

`unterminated string` or `malformed JSON` errors usually mean the generator
response was truncated or the model ignored the JSON schema. First increase
`--minimum-num-predict`, then reduce `--generate-count` if the model still
fails. Retries now expand the output-token budget slightly on later attempts,
but a too-small initial budget can still waste time.

The resulting files are:

```text
pytorch_route_ranker/data/hard_example_training_data.jsonl
pytorch_route_ranker/data/hard_example_training_manifest.json
pytorch_route_ranker/data/hard_example_training_progress.json
```

All three are ignored by Git because they may contain confidential user queries.
The manifest records generation counts, rejected candidates, registry
fingerprint, model, and local inference timings. The generated JSONL dataset is
automatically included by `ranker:train` and snapshotted by
`ranker:experiment`.

The progress file is atomically refreshed while generation runs. It reports
`status`, `phase`, `correctionsPlanned`, `correctionsCompleted`, the active
`currentCorrection`, accepted and rejected counts, elapsed time, and up to five
recently completed corrections. A failed run leaves `status: "failed"`, the
active evidence ID, and the error message in this file. A successful run leaves
`status: "complete"`.

Watch it on Linux:

```bash
watch -n 1 'cat pytorch_route_ranker/data/hard_example_training_progress.json'
```

Use `--progress path/to/progress.json` to choose another location. Dry runs do
not create or modify the progress file.

Do not normally use `--skip-semantic-validation`. It exists for controlled
diagnostics, but omitting the second review pass increases the risk that a
paraphrase changes the intended route, scope, location, time meaning, or
exclusion. If an approval is revoked or the route registry fingerprint
changes, the associated generated hard examples are removed on the next run.

## 4. Train And Evaluate

```bash
npm run ranker:train
npm run ranker:evaluate
```

Training uses `--device auto` by default. It selects CUDA when available,
otherwise Apple MPS when available, and otherwise CPU. Select a device
explicitly when needed:

```bash
npm run ranker:train -- --device cuda
npm run ranker:train -- --device cuda:1
npm run ranker:train -- --device mps
npm run ranker:train -- --device cpu
```

The model, route vectors, training targets, validation targets, loss weights,
and batch indices are moved onto the selected device. Checkpoints store the
training-device description but save model weights on CPU so they remain
portable to the lower-powered inference machine.

Training also displays and records both model-size counts:

```text
totalParameters=1639682 trainableParameters=1639682
```

`totalParameters` counts every model parameter. `trainableParameters` counts
only parameters whose `requires_grad` value allows the optimizer to update
them. Experiment configurations and `summary.csv` preserve both values, while
`npm run ranker:status` displays them for the active checkpoint.

Training writes the ignored local checkpoint:

```text
pytorch_route_ranker/models/route_ranker.pt
```

Evaluation reports:

- single/multiple scope accuracy;
- top-route accuracy;
- relevant-route recall;
- exact route-set accuracy, precision, F1, and route-count error;
- a dedicated breakdown for multiple-route requests;
- per-category metrics and a separate critical-example breakdown;
- fallback rate;
- average local latency.

Held-out examples can identify one or more categories and safety-critical cases:

```json
{"query":"show all runway wind data","scope":"multiple","relevantRouteIds":["wind-current-observations","wind-runway-impact"],"categories":["wind","runway"],"critical":true}
```

When `categories` is omitted, evaluation infers categories from the first
keyword of each expected route. Explicit test categories are preferred because
they remain meaningful if route metadata changes.

Before production use, create a separate expert-reviewed test file that is
never used for training and run:

```bash
npm run ranker:evaluate -- \
  --data path/to/held_out_test.jsonl \
  --output path/to/evaluation-results.json
```

The terminal prints only the overall, multiple-route, and critical summaries
by default. Complete per-category metrics and mismatches remain available in
the JSON report. Print either diagnostic section in the terminal only when
needed:

```bash
npm run ranker:evaluate -- \
  --data path/to/held_out_test.jsonl \
  --show-categories \
  --show-mismatches 10
```

## Automated Reproducible Experiments

Use the experiment runner instead of manually creating folders for every
training attempt:

```bash
npm run ranker:experiment -- \
  --run-name radar-keyword-update \
  --notes "Added radar synonyms and clarified composite descriptions" \
  --held-out-test pytorch_route_ranker/data/held_out_test.jsonl \
  --device cuda
```

Windows PowerShell uses the same command on one line:

```powershell
npm run ranker:experiment -- --run-name radar-keyword-update --notes "Added radar synonyms" --held-out-test pytorch_route_ranker\data\held_out_test.jsonl
```

The command automatically:

1. exports the current approved registry;
2. regenerates synthetic training examples;
3. creates a timestamped immutable run folder;
4. snapshots training data, held-out test data, and model source code;
5. records Python, Node, Git, registry, and training configuration;
6. trains a new model inside the run folder;
7. evaluates that exact model against the snapshotted held-out test;
8. stores detailed metrics in `evaluation-results.json`;
9. automatically compares the candidate with the active model when one exists;
10. stores `comparison.json`, all logs, and summary metrics in
    `pytorch_route_ranker/runs/summary.csv`.

Each completed run resembles:

```text
pytorch_route_ranker/runs/20260610-143000-radar-keyword-update/
  configuration.json
  notes.txt
  model.pt
  training-log.txt
  evaluation-log.txt
  evaluation-results.json
  comparison.json
  comparison-log.txt
  data/
  source/
```

Run folders are ignored by Git because they may contain large models and
confidential registry snapshots. Back them up using an approved internal
location. The runner never automatically promotes a model to
`pytorch_route_ranker/models/route_ranker.pt`; compare `summary.csv` and review
mismatches before promotion. A completed experiment never promotes itself.

## Compare, Promote, And Roll Back Models

Compare any candidate against the currently active checkpoint using the same
registry and frozen held-out test:

```bash
npm run ranker:compare -- \
  --candidate pytorch_route_ranker/runs/RUN_ID/model.pt \
  --data pytorch_route_ranker/data/held_out_test.jsonl \
  --output pytorch_route_ranker/runs/RUN_ID/comparison.json
```

The comparison rejects candidates that regress overall top-route or scope
accuracy, multiple-route recall or exact-set accuracy, critical examples, or
sufficiently represented categories. It also enforces fallback-rate and
latency limits. Review `comparison.json` even when the candidate is eligible.

Promote only an eligible, reviewed candidate:

```bash
npm run ranker:promote -- \
  --candidate pytorch_route_ranker/runs/RUN_ID/model.pt \
  --comparison pytorch_route_ranker/runs/RUN_ID/comparison.json \
  --approved-by "reviewer-name" \
  --reason "Improved held-out multiple-route recall without regressions"
```

For the first managed release only, when no active checkpoint exists, bootstrap
from a reviewed detailed evaluation:

```bash
npm run ranker:promote -- \
  --candidate pytorch_route_ranker/runs/RUN_ID/model.pt \
  --allow-initial \
  --initial-evaluation pytorch_route_ranker/runs/RUN_ID/evaluation-results.json \
  --approved-by "reviewer-name" \
  --reason "Approved initial managed model"
```

Promotion rejects stale comparisons, changed model files, and registry
mismatches. It archives immutable release copies, atomically replaces the
active checkpoint, and records the approval in
`pytorch_route_ranker/models/promotion_history.jsonl`. Check status and
available release IDs with:

```bash
npm run ranker:status
```

Roll back to an archived release:

```bash
npm run ranker:rollback -- \
  --release RELEASE_ID \
  --approved-by "reviewer-name" \
  --reason "Regression observed during controlled operational testing"
```

Restart `npm run ranker:api` after promotion or rollback. The running process
keeps its currently loaded checkpoint until restarted. These commands record
the supplied reviewer identity; production approval still requires appropriate
operating-system permissions and organisational access controls.

All npm ranker commands use `scripts/runPythonModule.mjs`. It prefers the
project's `pytorch_route_ranker/.venv`, then searches for `python`, `py -3.11`,
or `python3`, making the same commands usable on Windows and macOS. Set
`AMIDS_PYTHON_COMMAND` if the workplace Python executable uses another name.

## 5. Start The Ranker And Gateway

Terminal 1:

```bash
npm run ranker:api
```

Terminal 2:

```bash
AMIDS_ROUTING_PROVIDER=hybrid npm run api
```

Terminal 3:

```bash
npm run dev
```

Routing modes:

- `hybrid`: use PyTorch first and send uncertain/unavailable cases to Qwen.
- `pytorch`: use PyTorch and emergency registry fallback; never call Qwen.
- `ollama`: preserve the previous Qwen-only behavior.

Windows PowerShell example:

```powershell
$env:AMIDS_ROUTING_PROVIDER="hybrid"
npm run api
```

## API

Health:

```text
GET http://127.0.0.1:8001/health
```

Rank:

```http
POST http://127.0.0.1:8001/rank
Content-Type: application/json

{
  "query": "show all runway wind data",
  "roleKey": "pilot",
  "maxRoutes": 8,
  "routeBiases": {
    "wind-current-observations": 0.5
  }
}
```

The response includes `routeId`, `routeIds`, `requestScope`, `confidence`,
`needsFallback`, `fallbackReasons`, and diagnostic scores. `fallbackReasons`
distinguishes low route confidence from uncertain single/multiple scope,
missing selections, and insufficient multiple-route selections. Although the Python response includes
route metadata for testing, the Node gateway ignores its paths and resolves
the selected IDs from its own approved registry.

## Important Limitations

- The initial generated examples teach the registry's existing vocabulary; they
  do not automatically teach every aviation synonym or operational nuance.
- Expert examples are the main mechanism for specialisation.
- Confidence thresholds must be calibrated against held-out workplace queries.
- Keep Qwen fallback enabled until accuracy and recall meet an agreed test
  threshold.
- This is a navigation aid. It must not make flight-safety or operational
  decisions on behalf of pilots, ATC, or dispatchers.
