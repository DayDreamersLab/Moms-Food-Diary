# Mom's Food Diary Express/PostgreSQL Backend

This is an exemplar replacement for the Supabase backend. It mirrors the current app's main resources:

- email/password auth with JWTs
- profiles
- posts
- likes
- full-text search
- local image uploads for prototyping

The current Next.js frontend still uses Supabase. This backend is intentionally separate so you can test it before migrating frontend calls.

## Setup

```bash
cd backend-express-postgres
cp .env.example .env
# Edit .env and replace both example passwords.
set -a
. ./.env
set +a
npm install
docker compose up -d postgres
DATABASE_URL="$DATABASE_ADMIN_URL" npm run db:init
npm run db:grant-app-role
npm run dev
```

The API starts on `http://localhost:4000`.

The included Docker PostgreSQL example uses SCRAM-SHA-256 for database authentication. See [SECURITY.md](./SECURITY.md) for the reasoning, production caveats, and why Vault's PostgreSQL database secrets engine is not enabled by default in this prototype.

## Main Endpoints

```text
GET  /health

POST /auth/signup
POST /auth/login
GET  /auth/me

GET    /posts
POST   /posts
DELETE /posts/:id

POST   /posts/:postId/likes
DELETE /posts/:postId/likes

GET /profiles/:username
GET /search?q=adobo

POST /uploads/photo
```

Authenticated requests use:

```text
Authorization: Bearer <token>
```

## Example Requests

Sign up:

```bash
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "password123",
    "username": "demo",
    "display_name": "Demo User",
    "mom_name": "Mom"
  }'
```

Create a post:

```bash
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_FROM_LOGIN" \
  -d '{
    "dish_name": "Mom'\''s Adobo",
    "occasion": "Birthday dinner",
    "review": "The smell alone felt like home.",
    "recipe": "Soy sauce, vinegar, garlic, bay leaf, patience.",
    "rating": 5,
    "mood": "🥰 Loved"
  }'
```

Upload a photo:

```bash
curl -X POST http://localhost:4000/uploads/photo \
  -H "Authorization: Bearer TOKEN_FROM_LOGIN" \
  -F "photo=@/path/to/photo.jpg"
```

## Migration Notes

The frontend replacement would mostly happen in a new API client module. Replace:

```ts
supabase.auth.signInWithPassword(...)
supabase.from('posts').select(...)
supabase.storage.from('post-photos').upload(...)
```

with:

```ts
fetch(`${API_URL}/auth/login`, ...)
fetch(`${API_URL}/posts`, ...)
fetch(`${API_URL}/uploads/photo`, ...)
```

For production, replace local uploads with S3, Cloudflare R2, or MinIO, and store only public object URLs in `posts.photo_url`.
