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

You are helping refine an aviation routeRegistry for an AI navigation model.

The AI receives a user query and must choose the most relevant AMIDS route(s). Your task is to improve the metadata quality of the route registry so both a lexical ranker and semantic encoder can match user wording to routes more accurately.

You must preserve this exact object structure:
{
  "id": "...",
  "title": "...",
  "path": "...",
  "description": "...",
  "keywords": [...]
}

Strict rules:
- Do not add or remove properties.
- Do not change id.
- Do not change path.
- Do not invent new routes.
- Only improve title, description, and keywords if needed.
- Keep descriptions short, clear, and metadata-grounded.
- Do not rely on outside aviation knowledge unless it is a common synonym or abbreviation.
- Do not add generic standalone plain keywords like "weather", "data", "information", "display", "system", or "page" unless they are truly route-specific.
- Prefer specific plain keyword phrases, usually 2-5 words.
- Keep all keywords useful for matching likely user queries.

Keyword format:
Use these three labelled keyword types when appropriate:

1. topic:
Shared subject group. Should be common across related routes.
Examples:
"topic:wind"
"topic:satellite imagery"
"topic:regional weather"

2. purpose:
How the information is presented. Choose from this controlled vocabulary only:
overview-dashboard
live-status
detailed-record
data-table
comparison-view
time-series
forecast-view
historical-view
alert-feed
threshold-monitor
map-view
map-overlay
imagery-view
chart-view
timeline-view
report-view
bulletin-feed
source-document
procedure-reference
search-index
multi-source-composite
raw-data-view
download-export
audit-log
notification-inbox
interactive-tool

Example:
"purpose:forecast-view"

3. route:
Route-specific phrase or page identity. Usually close to the page title or common name.
Examples:
"route:radar satellite composite"
"route:wind current observations"

Plain keywords:
Use plain keywords for likely user wording, abbreviations, aliases, and specific operational phrases.
Good:
"satellite cloud image"
"radar satellite composite"
"current runway wind"
"crosswind threshold"
"latest ATIS"
Bad:
"image"
"weather"
"current"
"data"

For each route:
- Include 2-5 topic keywords.
- Include exactly 1 purpose keyword unless the route truly has two presentation types.
- Include 1-3 route keywords.
- Include 6-12 plain keywords.
- Prefer quality over quantity.
- Avoid near-duplicate keywords unless they represent real user wording differences, such as "forecast" and "fcst".
- If symbols appear, include a plain-word equivalent too.
  Example:
  "radar & satellite composite"
  "radar satellite composite"

Return only a valid JSON array.
Do not output markdown.
Do not explain your changes.

Here is the routeRegistry chunk to refine:
