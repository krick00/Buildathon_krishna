# Booklog — a Letterboxd-style social reading diary

A social reading diary for books. Track what you read, log & review with ratings/tags,
build a public reading identity, follow other readers, and curate lists.

Built with **Next.js App Router + TypeScript + Tailwind CSS**, backed by **Postgres**
(with seed data). Deployable to **Vercel + hosted Postgres**.

## Core loop

```
Search a book → add to library → log a reading → rate/review/tag/quote →
publish to profile/feed → discover through people & lists
```

## Quick start (local, with Docker Postgres)

```bash
npm install
docker compose up -d          # start local Postgres (postgres://booklog:booklog@localhost:5432/booklog)
npm run db:setup              # create schema + seed data + demo passwords
npm run dev                   # http://localhost:3000
```

`.env.local` should contain `DATABASE_URL` (see `.env.example`). The seed readers
(`maya`, `arjunreads`, `lina`) all share the demo password **`booklog123`**.

## Auth

Real accounts with username/password. Passwords are hashed with scrypt (Node `crypto`),
sessions are stored in a `sessions` table and referenced by an httpOnly cookie. Sign up,
log in, and log out from the nav. App routes (home, library, diary, quotes, lists, stats)
require login; public pages (books, profiles, lists, individual reviews) are viewable by
anyone.

## Database

Postgres, accessed through a small async data layer:

- `lib/db/pg.ts` — connection pool + `query` / `one` / `run` helpers
- `lib/db/queries.ts` — reads · `lib/db/mutations.ts` — writes
- `database/booklog_starter_sqlite_schema_and_seed.sql` — schema + seed (the `db:setup`
  script transforms it to Postgres dialect and loads it)

SSL is enabled automatically for hosted (non-localhost) connections.

## Deploy to Vercel + Postgres

1. **Provision Postgres** — create a database (Vercel Postgres, Neon, or Supabase) and copy
   its **pooled** connection string (append `?sslmode=require`).
2. **Seed it once** from your machine:
   ```bash
   DATABASE_URL="<your hosted pooled url>" npm run db:setup
   ```
3. **Push to GitHub**, then **import the repo into Vercel** (vercel.com/new).
4. In the Vercel project, add an env var **`DATABASE_URL`** = your hosted connection string.
5. **Deploy.** The build is DB-free (all pages are dynamic/server-rendered on demand), so it
   builds cleanly and connects to Postgres at request time.

## Routes

| Route | What |
|---|---|
| `/` | Landing |
| `/home` | Following feed |
| `/explore` | Trending books, lists, readers |
| `/search?q=` | Search local books/people/lists + **live Open Library** results |
| `/quotes` | Your saved favorite quotes |
| `/book/[id]` | Book detail — status, log, reviews, lists |
| `/library?status=` | Your shelves with status filters |
| `/diary` | Your reading diary |
| `/u/[username]` | Public profile (+ `/diary`) |
| `/lists`, `/list/[id]` | Your lists / public list page |
| `/log/[id]` | Shareable review/log page |
| `/stats` | Reading stats |

## Project structure

```
app/                Next.js routes + server actions (app/actions.ts)
components/          UI: BookCard, StatusButton, LogBookModal, FollowButton, LikeButton, …
lib/db/             pg.ts (Postgres pool + helpers), queries.ts (reads), mutations.ts (writes)
lib/auth/           currentUser.ts (dev user resolver + switcher)
lib/utils.ts        slug/date/id/label helpers
database/           schema + seed SQL
scripts/            pg-setup.mjs (create schema + seed Postgres)
types/              shared TypeScript types
```

## Live book search (Open Library)

Search hits your local Postgres first, then queries the **Open Library Search API**
(`openlibrary.org` — no API key required) for anything else, pulling minimal fields:
cover, author(s), first publish year, and page count. Clicking an external result
**imports it into the local DB** (deduped by work key) so you can immediately shelve, log,
review, and quote it. If Open Library is unreachable, search degrades gracefully to local
results with a short notice — the product never breaks on a failed external call.

## Data & AI

- **Postgres** holds all product data (users, sessions, books, logs, quotes, follows, lists,
  feed). `DATABASE_URL` is the only required env var.
- `AI_PROVIDER=none` — the app is fully functional with no AI. AI helpers (e.g. tag
  suggestions via an OpenAI-compatible gateway) are optional and must never be required
  for core functionality. Never expose secrets with `NEXT_PUBLIC_`; keep keys in
  `.env.local` only.

## Security

- No secrets are committed. `.env.local` is git-ignored; `.env.example` holds placeholders.
- All mutations resolve the current user server-side and check ownership before editing/deleting.
- Private/followers-only content is filtered out of public views.
- All SQL uses prepared statements.
