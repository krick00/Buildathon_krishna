import "server-only";
import { query, one, run } from "@/lib/db/pg";
import { newId, nowIso, slugify } from "@/lib/utils";
import type { BookStatus, Format, LogStatus, UserBook, Visibility } from "@/types";

async function createActivityEvent(
  userId: string,
  eventType: string,
  targetType: string,
  targetId: string,
  bookId: string | null,
  metadata: Record<string, unknown> | null,
  visibility: Visibility
) {
  await run(
    `INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      newId(),
      userId,
      eventType,
      targetType,
      targetId,
      bookId,
      metadata ? JSON.stringify(metadata) : null,
      visibility,
      nowIso(),
    ]
  );
}

export async function upsertUserBook(
  userId: string,
  bookId: string,
  status: BookStatus,
  patch: Partial<Pick<UserBook, "rating" | "format" | "progress_pages" | "progress_percent">> = {}
): Promise<UserBook> {
  const existing = await one<UserBook>(
    "SELECT * FROM user_books WHERE user_id = $1 AND book_id = $2",
    [userId, bookId]
  );
  const now = nowIso();
  const today = now.slice(0, 10);

  if (existing) {
    await run(
      `UPDATE user_books SET
         status = $1,
         rating = COALESCE($2, rating),
         format = COALESCE($3, format),
         progress_pages = COALESCE($4, progress_pages),
         progress_percent = COALESCE($5, progress_percent),
         started_at = CASE WHEN $1 = 'reading' AND started_at IS NULL THEN $6 ELSE started_at END,
         finished_at = CASE WHEN $1 = 'read' THEN COALESCE(finished_at, $6) ELSE finished_at END,
         dnf_at = CASE WHEN $1 = 'dnf' THEN COALESCE(dnf_at, $6) ELSE dnf_at END,
         updated_at = $7
       WHERE id = $8`,
      [
        status,
        patch.rating ?? null,
        patch.format ?? null,
        patch.progress_pages ?? null,
        patch.progress_percent ?? null,
        today,
        now,
        existing.id,
      ]
    );
    return (await one<UserBook>("SELECT * FROM user_books WHERE id = $1", [existing.id]))!;
  }

  const id = newId();
  await run(
    `INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'public', $12, $12)`,
    [
      id,
      userId,
      bookId,
      status,
      patch.rating ?? null,
      patch.format ?? null,
      status === "reading" ? today : null,
      status === "read" ? today : null,
      status === "dnf" ? today : null,
      patch.progress_pages ?? null,
      patch.progress_percent ?? null,
      now,
    ]
  );

  const eventType = status === "reading" ? "book_started" : "book_added";
  await createActivityEvent(userId, eventType, "user_book", id, bookId, null, "public");
  return (await one<UserBook>("SELECT * FROM user_books WHERE id = $1", [id]))!;
}

export async function deleteUserBook(userId: string, userBookId: string): Promise<boolean> {
  const changes = await run("DELETE FROM user_books WHERE id = $1 AND user_id = $2", [
    userBookId,
    userId,
  ]);
  return changes > 0;
}

async function upsertTagsBySlug(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const slug = slugify(name);
    if (!slug) continue;

    const inserted = await one<{ id: string }>(
      "INSERT INTO tags (id, name, slug, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING RETURNING id",
      [newId(), name, slug, nowIso()]
    );
    if (inserted) {
      ids.push(inserted.id);
    } else {
      const existing = await one<{ id: string }>("SELECT id FROM tags WHERE slug = $1", [slug]);
      if (existing) ids.push(existing.id);
    }
  }
  return Array.from(new Set(ids));
}

export type ImportBookInput = {
  workKey: string;
  title: string;
  authors: string[];
  coverUrl?: string | null;
  firstPublishYear?: number | null;
  pageCount?: number | null;
};

export async function importBook(data: ImportBookInput): Promise<string> {
  const existing = await one<{ id: string }>(
    "SELECT id FROM books WHERE open_library_work_key = $1",
    [data.workKey]
  );
  if (existing) return existing.id;

  const id = newId();
  const now = nowIso();
  await run(
    `INSERT INTO books
       (id, title, subtitle, description, cover_url, first_publish_year, page_count, language,
        source, open_library_work_key, open_library_edition_key, google_books_id,
        isbn_10, isbn_13, subjects, created_at, updated_at)
     VALUES ($1, $2, NULL, NULL, $3, $4, $5, NULL, 'open_library', $6, NULL, NULL, NULL, NULL, NULL, $7, $7)`,
    [id, data.title, data.coverUrl ?? null, data.firstPublishYear ?? null, data.pageCount ?? null, data.workKey, now]
  );

  let order = 0;
  for (const rawName of data.authors) {
    const name = rawName.trim();
    if (!name) continue;
    let author = await one<{ id: string }>("SELECT id FROM authors WHERE name ILIKE $1", [name]);
    if (!author) {
      const authorId = newId();
      await run("INSERT INTO authors (id, name, created_at, updated_at) VALUES ($1, $2, $3, $3)", [
        authorId,
        name,
        now,
      ]);
      author = { id: authorId };
    }
    await run(
      "INSERT INTO book_authors (book_id, author_id, author_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [id, author.id, order++]
    );
  }
  return id;
}

export type CreateQuoteInput = {
  bookId: string;
  quoteText: string;
  page?: number | null;
  note?: string | null;
  visibility?: Visibility;
};

export async function createQuote(userId: string, input: CreateQuoteInput): Promise<string> {
  const id = newId();
  const visibility: Visibility = input.visibility ?? "public";
  await run(
    `INSERT INTO quotes (id, user_id, book_id, quote_text, page, note, visibility, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, userId, input.bookId, input.quoteText.trim(), input.page ?? null, input.note?.trim() || null, visibility, nowIso()]
  );
  await createActivityEvent(userId, "quote_added", "quote", id, input.bookId, null, visibility);
  return id;
}

export async function deleteQuote(userId: string, quoteId: string): Promise<boolean> {
  const changes = await run("DELETE FROM quotes WHERE id = $1 AND user_id = $2", [quoteId, userId]);
  if (changes > 0) {
    await run(
      "DELETE FROM activity_events WHERE target_type = 'quote' AND target_id = $1 AND user_id = $2",
      [quoteId, userId]
    );
  }
  return changes > 0;
}

export type CreateLogInput = {
  bookId: string;
  logDate: string;
  status: LogStatus;
  rating?: number | null;
  reviewText?: string | null;
  containsSpoilers?: boolean;
  isReread?: boolean;
  progressPercent?: number | null;
  format?: Format | null;
  visibility?: Visibility;
  tags?: string[];
};

export async function createReadingLog(userId: string, input: CreateLogInput): Promise<string> {
  const now = nowIso();
  const visibility: Visibility = input.visibility ?? "public";

  let userBookId: string | null = null;
  const derivedStatus: BookStatus | null =
    input.status === "finished"
      ? "read"
      : input.status === "dnf"
        ? "dnf"
        : input.status === "started" || input.status === "progress"
          ? "reading"
          : input.status === "paused"
            ? "paused"
            : null;

  if (derivedStatus) {
    const ub = await upsertUserBook(userId, input.bookId, derivedStatus, {
      rating: input.rating ?? undefined,
      format: input.format ?? undefined,
      progress_percent: input.progressPercent ?? undefined,
    });
    userBookId = ub.id;
  } else {
    const existingUb = await one<{ id: string }>(
      "SELECT id FROM user_books WHERE user_id = $1 AND book_id = $2",
      [userId, input.bookId]
    );
    userBookId = existingUb?.id ?? null;
  }

  const logId = newId();
  await run(
    `INSERT INTO reading_logs
       (id, user_id, book_id, user_book_id, log_date, started_at, finished_at, status, rating,
        review_text, contains_spoilers, is_reread, progress_pages, progress_percent, format, visibility, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9, $10, $11, NULL, $12, $13, $14, $15, $15)`,
    [
      logId,
      userId,
      input.bookId,
      userBookId,
      input.logDate,
      input.status === "finished" ? input.logDate : null,
      input.status,
      input.rating ?? null,
      input.reviewText?.trim() || null,
      input.containsSpoilers ? 1 : 0,
      input.isReread ? 1 : 0,
      input.progressPercent ?? null,
      input.format ?? null,
      visibility,
      now,
    ]
  );

  const tagIds = await upsertTagsBySlug(input.tags ?? []);
  for (const tagId of tagIds) {
    await run(
      "INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [logId, tagId]
    );
  }

  const eventType =
    input.status === "finished"
      ? "book_finished"
      : input.status === "dnf"
        ? "book_dnf"
        : input.status === "started"
          ? "book_started"
          : "review_created";
  await createActivityEvent(userId, eventType, "reading_log", logId, input.bookId, { log_date: input.logDate }, visibility);

  return logId;
}

export async function updateReadingLog(
  userId: string,
  logId: string,
  patch: Partial<CreateLogInput>
): Promise<boolean> {
  const log = await one<{ user_id: string }>("SELECT user_id FROM reading_logs WHERE id = $1", [
    logId,
  ]);
  if (!log || log.user_id !== userId) return false;

  await run(
    `UPDATE reading_logs SET
       rating = $1, review_text = $2, contains_spoilers = $3, is_reread = $4,
       status = COALESCE($5, status), visibility = COALESCE($6, visibility),
       format = $7, log_date = COALESCE($8, log_date), updated_at = $9
     WHERE id = $10 AND user_id = $11`,
    [
      patch.rating ?? null,
      patch.reviewText?.trim() || null,
      patch.containsSpoilers ? 1 : 0,
      patch.isReread ? 1 : 0,
      patch.status ?? null,
      patch.visibility ?? null,
      patch.format ?? null,
      patch.logDate ?? null,
      nowIso(),
      logId,
      userId,
    ]
  );

  if (patch.tags) {
    await run("DELETE FROM reading_log_tags WHERE reading_log_id = $1", [logId]);
    const tagIds = await upsertTagsBySlug(patch.tags);
    for (const tagId of tagIds) {
      await run(
        "INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [logId, tagId]
      );
    }
  }
  return true;
}

export async function deleteReadingLog(userId: string, logId: string): Promise<boolean> {
  const changes = await run("DELETE FROM reading_logs WHERE id = $1 AND user_id = $2", [logId, userId]);
  if (changes > 0) {
    await run(
      "DELETE FROM activity_events WHERE target_type = 'reading_log' AND target_id = $1 AND user_id = $2",
      [logId, userId]
    );
  }
  return changes > 0;
}

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;
  await run(
    "INSERT INTO follows (follower_id, following_id, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
    [followerId, followingId, nowIso()]
  );
  return true;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  await run("DELETE FROM follows WHERE follower_id = $1 AND following_id = $2", [followerId, followingId]);
  return true;
}

export async function likeTarget(
  userId: string,
  targetType: "reading_log" | "list",
  targetId: string
) {
  await run(
    "INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
    [newId(), userId, targetType, targetId, nowIso()]
  );
}

export async function unlikeTarget(
  userId: string,
  targetType: "reading_log" | "list",
  targetId: string
) {
  await run("DELETE FROM likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3", [
    userId,
    targetType,
    targetId,
  ]);
}

export async function createBookList(
  userId: string,
  input: { title: string; description?: string | null; visibility?: Visibility }
): Promise<string> {
  const id = newId();
  const now = nowIso();
  const base = slugify(input.title) || "list";
  let slug = base;
  let n = 1;
  while (await one("SELECT 1 FROM book_lists WHERE user_id = $1 AND slug = $2", [userId, slug])) {
    slug = `${base}-${n++}`;
  }

  await run(
    `INSERT INTO book_lists (id, user_id, title, slug, description, visibility, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [id, userId, input.title.trim(), slug, input.description?.trim() || null, input.visibility ?? "public", now]
  );
  await createActivityEvent(userId, "list_created", "list", id, null, { title: input.title.trim() }, input.visibility ?? "public");
  return id;
}

export async function addBookToList(
  userId: string,
  listId: string,
  bookId: string,
  note?: string | null
): Promise<boolean> {
  const list = await one<{ user_id: string }>("SELECT user_id FROM book_lists WHERE id = $1", [listId]);
  if (!list || list.user_id !== userId) return false;

  const exists = await one("SELECT 1 FROM book_list_items WHERE list_id = $1 AND book_id = $2", [listId, bookId]);
  if (exists) return false;

  const maxRow = await one<{ m: number }>(
    "SELECT COALESCE(MAX(position), 0)::int AS m FROM book_list_items WHERE list_id = $1",
    [listId]
  );
  await run(
    "INSERT INTO book_list_items (id, list_id, book_id, position, note, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [newId(), listId, bookId, (maxRow?.m ?? 0) + 1, note?.trim() || null, nowIso()]
  );
  return true;
}

export async function removeBookFromList(userId: string, listItemId: string): Promise<boolean> {
  const row = await one<{ user_id: string }>(
    `SELECT bl.user_id FROM book_list_items bli
     JOIN book_lists bl ON bl.id = bli.list_id WHERE bli.id = $1`,
    [listItemId]
  );
  if (!row || row.user_id !== userId) return false;
  await run("DELETE FROM book_list_items WHERE id = $1", [listItemId]);
  return true;
}

export async function deleteBookList(userId: string, listId: string): Promise<boolean> {
  const changes = await run("DELETE FROM book_lists WHERE id = $1 AND user_id = $2", [listId, userId]);
  return changes > 0;
}
