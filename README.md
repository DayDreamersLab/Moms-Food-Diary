# 🍲 Mom's Food Diary — Full Stack Setup Guide

A warm, cozy food diary web app where users share memories of their mom's cooking.

**Stack:** Next.js 14 · Supabase (Auth + Postgres + Storage) · TypeScript · Tailwind CSS

---

## 🚀 Getting Started

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **"New Project"**, give it a name (e.g. `moms-table`), set a database password
3. Wait ~2 minutes for it to provision

---

### Step 2 — Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from this project
3. Paste the entire contents and click **Run**

This creates:
- `profiles` table (user accounts)
- `posts` table (diary entries with full-text search)
- `likes` table (reactions)
- Row Level Security policies

---

### Step 3 — Create the Photo Storage Bucket

In the Supabase dashboard, go to **SQL Editor** and run:

```sql
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', true);

create policy "Public photo access"
  on storage.objects for select
  using (bucket_id = 'post-photos');

create policy "Auth users upload photos"
  on storage.objects for insert
  with check (bucket_id = 'post-photos' and auth.role() = 'authenticated');

create policy "Users delete own photos"
  on storage.objects for delete
  using (bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]);
```

---

### Step 4 — Configure Environment Variables

1. In Supabase, go to **Project Settings → API**
2. Copy your **Project URL** and **anon public key**
3. In this project folder, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

4. Fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### Step 5 — Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
moms-food-diary/
├── app/
│   ├── auth/page.tsx          # Sign in / Sign up
│   ├── feed/page.tsx          # Public community feed
│   ├── diary/page.tsx         # Personal diary (your posts only)
│   ├── search/page.tsx        # Search by dish name / ingredient
│   └── profile/[username]/    # Any user's public profile
├── components/
│   ├── Navbar.tsx             # Top navigation
│   ├── PostCard.tsx           # Reusable post card with reactions
│   └── NewPostModal.tsx       # Create new memory modal
├── lib/
│   ├── supabase.ts            # Supabase browser client
│   └── types.ts               # TypeScript interfaces
├── supabase-schema.sql        # Database setup (run in Supabase)
└── .env.example               # Environment variable template
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Auth | Email/password sign up & sign in via Supabase Auth |
| 📖 My Diary | Personal view of all your own posts |
| 🌍 Community Feed | Browse latest posts from all users |
| 🔍 Search | Full-text search by dish name or ingredient |
| 👤 Profiles | View any user's public diary page |
| ❤️ Reactions | Like/react to posts with emoji picker |
| 📸 Photos | Upload photos stored in Supabase Storage |
| ⭐ Ratings | 1–5 star ratings per dish |
| 🌿 Moods | Emotional tags (Homesick, Loved, Nostalgic...) |
| 📜 Recipes | Collapsible recipe section on each post |

---

## 🌐 Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
as environment variables in the Vercel project dashboard.

---

## 💛 Built with love for moms everywhere

npm run ranker:generate-synthetic-expert -- \
  --model qwen3:32b \
  --validator-model gemma3:27b \
  --target-count 5000 \
  --tasks-per-call 1 \
  --task-order balanced \
  --single-examples-per-route 18 \
  --hard-examples-per-route 8 \
  --topic-examples-per-group 18 \
  --purpose-examples-per-group 12 \
  --contrast-route-limit 4 \
  --group-route-context-limit 8 \
  --route-topic-limit 5 \
  --route-purpose-limit 2 \
  --route-phrase-limit 3 \
  --plain-keyword-limit 10 \
  --include-descriptions \
  --minimum-num-predict 900 \
  --num-predict-per-example 60 \
  --num-ctx 8192 \
  --timeout-seconds 600 \
  --retries 5 \
  --seed 20260625 \
  --no-resume \
  --output pytorch_route_ranker/data/synthetic_expert_seed_examples_v2.jsonl \
  --manifest pytorch_route_ranker/data/synthetic_expert_seed_manifest_v2.json \
  --progress pytorch_route_ranker/data/synthetic_expert_seed_progress_v2.json \
  --checkpoint pytorch_route_ranker/data/synthetic_expert_seed_checkpoint_v2.json

  npm run ranker:generate-synthetic-expert -- \
  --model qwen3:32b \
  --validator-model gemma3:27b \
  --target-count 3500 \
  --tasks-per-call 1 \
  --task-order balanced \
  --single-examples-per-route 16 \
  --hard-examples-per-route 8 \
  --topic-examples-per-group 14 \
  --purpose-examples-per-group 10 \
  --contrast-route-limit 4 \
  --group-route-context-limit 8 \
  --route-topic-limit 5 \
  --route-purpose-limit 2 \
  --route-phrase-limit 3 \
  --plain-keyword-limit 10 \
  --include-descriptions \
  --minimum-num-predict 850 \
  --num-predict-per-example 55 \
  --num-ctx 8192 \
  --timeout-seconds 600 \
  --retries 5 \
  --seed 20260625 \
  --no-resume \
  --output pytorch_route_ranker/data/synthetic_expert_seed_examples_v2.jsonl \
  --manifest pytorch_route_ranker/data/synthetic_expert_seed_manifest_v2.json \
  --progress pytorch_route_ranker/data/synthetic_expert_seed_progress_v2.json \
  --checkpoint pytorch_route_ranker/data/synthetic_expert_seed_checkpoint_v2.json

python - <<'PY'
from pathlib import Path
import json
from pytorch_route_ranker.app.text_features import normalize_text

needle = normalize_text("lightning overlaid onto radar")
paths = [
    Path("pytorch_route_ranker/data/generated_training_examples.jsonl"),
    Path("pytorch_route_ranker/data/expert_training_examples.jsonl"),
    Path("pytorch_route_ranker/data/hard_example_training_data.jsonl"),
    Path("pytorch_route_ranker/data/synthetic_expert_seed_examples.jsonl"),
    Path("pytorch_route_ranker/data/synthetic_expert_seed_examples_v2.jsonl"),
]

for path in paths:
    if not path.exists():
        continue
    with path.open(encoding="utf-8") as file:
        for line_number, line in enumerate(file, 1):
            if not line.strip():
                continue
            record = json.loads(line)
            if normalize_text(record.get("query", "")) == needle:
                print(path, line_number)
                print(record)
                print()
PY

npm run ranker:generate-held-out-candidates -- \
  --model qwen3:30b \
  --validator-model gemma3:27b \
  --target-count 200 \
  --tasks-per-call 2 \
  --candidate-variants-per-combination 4 \
  --single-examples-per-route 1 \
  --hard-examples-per-route 1 \
  --topic-examples-per-group 2 \
  --purpose-examples-per-group 1 \
  --num-ctx 4096 \
  --minimum-num-predict 600 \
  --num-predict-per-example 40 \
  --timeout-seconds 240 \
  --retries 4 \
  --seed 42


  1. Normal Generated Data: About 10,000
npm run ranker:generate -- \
  --seed 42 \
  --random-variants-per-anchor 10 \
  --typo-variants-per-example 1 \
  --max-typos 1 \
  --max-route-keyword-anchors 10 \
  --contrast-routes-per-route 2 \
  --max-single-examples-per-route 70 \
  --max-multiple-examples-per-route-set 35
Check count:
wc -l pytorch_route_ranker/data/generated_training_examples.jsonl
If too high, reduce --max-single-examples-per-route to 60 or 65. If too low, increase to 75 or 80.
2. Synthetic Expert Seed: About 12,000
npm run ranker:generate-synthetic-expert -- \
  --model qwen3:30b \
  --validator-model command-r:35b \
  --target-count 12000 \
  --tasks-per-call 2 \
  --task-order shuffled-balanced \
  --single-examples-per-route 35 \
  --hard-examples-per-route 18 \
  --topic-examples-per-group 30 \
  --purpose-examples-per-group 22 \
  --bundle-examples-per-pair 10 \
  --bundle-task-limit 350 \
  --bundle-candidates-per-route 4 \
  --contrast-route-limit 3 \
  --include-descriptions \
  --minimum-num-predict 1200 \
  --num-predict-per-example 55 \
  --num-ctx 4096 \
  --timeout-seconds 420 \
  --retries 5 \
  --seed 42 \
  --no-resume
   
This uses Qwen for generation and Command R for validation, as you wanted.

top-up:
npm run ranker:generate-synthetic-expert -- \
  --model qwen3:30b \
  --validator-model command-r:35b \
  --target-count 12000 \
  --tasks-per-call 2 \
  --task-order shuffled-balanced \
  --single-examples-per-route 50 \
  --hard-examples-per-route 25 \
  --topic-examples-per-group 45 \
  --purpose-examples-per-group 35 \
  --bundle-examples-per-pair 14 \
  --bundle-task-limit 700 \
  --bundle-candidates-per-route 6 \
  --contrast-route-limit 4 \
  --include-descriptions \
  --minimum-num-predict 1500 \
  --num-predict-per-example 65 \
  --num-ctx 8192 \
  --timeout-seconds 600 \
  --retries 5 \
  --seed 43 \
  --no-resume

4. Hard Examples
Only run this when you already have approved correction evidence.
npm run ranker:generate-hard-examples -- \
  --model command-r:35b \
  --validator-model qwen3:30b \
  --generate-count 30 \
  --max-paraphrases 15 \
  --timeout-seconds 300 \
  --retries 5 \
  --seed 42
Hard examples should stay review-driven. I would not try to force thousands of these yet.
5. Held-Out Candidates
I’d generate around 800. That is enough to review and evaluate without turning held-out data into another synthetic training-sized dataset.
npm run ranker:generate-heldout-candidates -- \
  --model gemma3:27b \
  --validator-model qwen3:30b \
  --target-count 800 \
  --tasks-per-call 2 \
  --task-order shuffled-balanced \
  --candidate-variants-per-combination 12 \
  --single-examples-per-route 4 \
  --hard-examples-per-route 4 \
  --topic-examples-per-group 8 \
  --purpose-examples-per-group 6 \
  --include-descriptions \
  --minimum-num-predict 900 \
  --num-predict-per-example 55 \
  --num-ctx 4096 \
  --timeout-seconds 360 \
  --retries 5 \
  --seed 84

   npm run ranker:generate-heldout-candidates -- \
  --model command-r:35b \
  --validator-model qwen3:30b \
  --target-count 1500 \
  --tasks-per-call 2 \
  --task-order shuffled-balanced \
  --single-examples-per-route 10 \
  --hard-examples-per-route 8 \
  --topic-examples-per-group 12 \
  --purpose-examples-per-group 8 \
  --candidate-variants-per-combination 14 \
  --contrast-route-limit 4 \
  --group-route-context-limit 10 \
  --route-topic-limit 8 \
  --route-purpose-limit 3 \
  --route-phrase-limit 5 \
  --plain-keyword-limit 12 \
  --include-descriptions \
  --minimum-num-predict 900 \
  --num-predict-per-example 60 \
  --num-ctx 4096 \
  --near-duplicate-threshold 0.92 \
  --timeout-seconds 360 \
  --retries 5 \
  --seed 84

   npm run ranker:generate-heldout-candidates -- \
  --model command-r:35b \
  --validator-model qwen3:30b \
  --target-count 1500 \
  --tasks-per-call 2 \
  --task-order shuffled-balanced \
  --single-examples-per-route 10 \
  --hard-examples-per-route 8 \
  --topic-examples-per-group 12 \
  --purpose-examples-per-group 8 \
  --bundle-examples-per-pair 8 \
  --bundle-task-limit 450 \
  --bundle-candidates-per-route 6 \
  --candidate-variants-per-combination 18 \
  --accepted-per-combination 8 \
  --contrast-route-limit 4 \
  --group-route-context-limit 10 \
  --route-topic-limit 8 \
  --route-purpose-limit 3 \
  --route-phrase-limit 5 \
  --plain-keyword-limit 12 \
  --include-descriptions \
  --minimum-num-predict 1100 \
  --num-predict-per-example 70 \
  --num-ctx 4096 \
  --near-duplicate-threshold 0.90 \
  --coverage-near-duplicate-threshold 0.97 \
  --timeout-seconds 420 \
  --retries 5 \
  --seed 84

Run 1: Moderate anti-overfit
npm run ranker:train -- \
  --epochs 20 \
  --batch-size 32 \
  --learning-rate 0.0003 \
  --weight-decay 0.002 \
  --dropout 0.35 \
  --relevance-label-smoothing 0.08 \
  --relevance-positive-weight 3 \
  --scope-loss-weight 0.25 \
  --validation-fraction 0.20 \
  --seed 42 \
  --device cuda
Run 2: Stronger regularization
npm run ranker:train -- \
  --epochs 18 \
  --batch-size 32 \
  --learning-rate 0.00025 \
  --weight-decay 0.004 \
  --dropout 0.45 \
  --relevance-label-smoothing 0.10 \
  --relevance-positive-weight 2.5 \
  --scope-loss-weight 0.2 \
  --validation-fraction 0.20 \
  --seed 42 \
  --device cuda
Run 3: If it underfits
npm run ranker:train -- \
  --epochs 25 \
  --batch-size 32 \
  --learning-rate 0.0005 \
  --weight-decay 0.001 \
  --dropout 0.30 \
  --relevance-label-smoothing 0.05 \
  --relevance-positive-weight 4 \
  --scope-loss-weight 0.3 \
  --validation-fraction 0.20 \
  --seed 42 \
  --device cuda
