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
