# AGENTS.md

## Project identity

A Letterboxd-style social reading diary for books (not a Goodreads clone). Core loop:

```
Search book -> add to library -> log reading -> rate/review/tag -> publish to profile/feed -> discover through people/lists
```

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Local data: SQLite via Node's built-in `node:sqlite` (`DatabaseSync`) — no native build needed.
  (Spec suggested `better-sqlite3`; it fails to compile on Node 24 here, so we use `node:sqlite`.
  Same synchronous API shape; the data layer is portable.)
- Production later: Supabase Postgres (keep query/mutation function signatures stable).

## Current mode

```
DATA_MODE=sqlite
SQLITE_DB_PATH=./database/booklog_starter.sqlite
AI_PROVIDER=none
```

AI features are optional. The app must remain fully usable without any AI/API access.

## Security rules

- Never hardcode API keys; never prefix secrets with `NEXT_PUBLIC_`.
- Server-side mutations must resolve the current user and check ownership.
- Private/followers-only content must not leak into public views.
- Use prepared statements (already the default in `lib/db`).

## Data rules

The schema in `database/booklog_starter_sqlite_schema_and_seed.sql` is the source of truth.
Key tables: profiles, books, authors, book_authors, user_books, reading_logs, tags,
reading_log_tags, follows, book_lists, book_list_items, likes, activity_events.
Reviews live in `reading_logs.review_text`.

## UX rules

Every page has loading, empty, and error states, a mobile layout, and keyboard-accessible
controls. Every mutation produces a visible UI update.

## Data access boundary

- Reads: `lib/db/queries.ts` (called from server components)
- Writes: `lib/db/mutations.ts`, wrapped by server actions in `app/actions.ts`
- Never import `lib/db/*` into client components.

## Definition of done

Route exists · query/mutation works · loading/empty/error states · ownership/auth on
mutations · works at mobile width · does not require a live AI API.
