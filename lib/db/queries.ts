import "server-only";
import { query, one } from "@/lib/db/pg";
import type {
  Book,
  BookList,
  BookSearchResult,
  DiaryEntry,
  FeedItem,
  Profile,
  Quote,
  Tag,
  UserBook,
} from "@/types";

type AuthorRow = { book_id: string; id: string; name: string };

function placeholders(n: number, start = 1): string {
  return Array.from({ length: n }, (_, i) => `$${i + start}`).join(",");
}

async function attachAuthors(
  bookIds: string[]
): Promise<Map<string, { id: string; name: string }[]>> {
  const map = new Map<string, { id: string; name: string }[]>();
  if (bookIds.length === 0) return map;
  const rows = await query<AuthorRow>(
    `SELECT ba.book_id, a.id, a.name
     FROM book_authors ba
     JOIN authors a ON a.id = ba.author_id
     WHERE ba.book_id IN (${placeholders(bookIds.length)})
     ORDER BY ba.author_order ASC`,
    bookIds
  );
  for (const r of rows) {
    if (!map.has(r.book_id)) map.set(r.book_id, []);
    map.get(r.book_id)!.push({ id: r.id, name: r.name });
  }
  return map;
}

function toSearchResult(
  book: Pick<Book, "id" | "title" | "subtitle" | "cover_url" | "first_publish_year">,
  authors: { id: string; name: string }[]
): BookSearchResult {
  return {
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    coverUrl: book.cover_url,
    firstPublishYear: book.first_publish_year,
    authors,
  };
}

export async function searchBooks(q: string, limit = 30): Promise<BookSearchResult[]> {
  const trimmed = q.trim();
  let books: Book[];
  if (!trimmed) {
    books = await query<Book>(
      "SELECT * FROM books ORDER BY first_publish_year DESC NULLS LAST LIMIT $1",
      [limit]
    );
  } else {
    const like = `%${trimmed}%`;
    books = await query<Book>(
      `SELECT DISTINCT b.*
       FROM books b
       LEFT JOIN book_authors ba ON ba.book_id = b.id
       LEFT JOIN authors a ON a.id = ba.author_id
       WHERE b.title ILIKE $1 OR a.name ILIKE $1
       ORDER BY b.title ASC
       LIMIT $2`,
      [like, limit]
    );
  }
  const authors = await attachAuthors(books.map((b) => b.id));
  return books.map((b) => toSearchResult(b, authors.get(b.id) ?? []));
}

export async function searchProfiles(q: string, limit = 10): Promise<Profile[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const like = `%${trimmed}%`;
  return query<Profile>(
    `SELECT * FROM profiles
     WHERE username ILIKE $1 OR display_name ILIKE $1
     ORDER BY username LIMIT $2`,
    [like, limit]
  );
}

export async function searchLists(q: string, limit = 10) {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const like = `%${trimmed}%`;
  return query<BookList & { username: string; display_name: string | null }>(
    `SELECT bl.*, p.username, p.display_name
     FROM book_lists bl JOIN profiles p ON p.id = bl.user_id
     WHERE bl.visibility = 'public' AND (bl.title ILIKE $1 OR bl.description ILIKE $1)
     ORDER BY bl.created_at DESC LIMIT $2`,
    [like, limit]
  );
}

export async function getBookById(
  bookId: string
): Promise<(Book & { authors: { id: string; name: string }[] }) | null> {
  const book = await one<Book>("SELECT * FROM books WHERE id = $1", [bookId]);
  if (!book) return null;
  const authors = (await attachAuthors([bookId])).get(bookId) ?? [];
  return { ...book, authors };
}

export async function getBookRatingSummary(
  bookId: string
): Promise<{ avg: number | null; count: number }> {
  const row = await one<{ avg: number | null; count: number }>(
    `SELECT AVG(rating)::float AS avg, COUNT(rating)::int AS count
     FROM user_books WHERE book_id = $1 AND rating IS NOT NULL`,
    [bookId]
  );
  return { avg: row?.avg ?? null, count: row?.count ?? 0 };
}

export async function getUserBook(userId: string, bookId: string): Promise<UserBook | null> {
  return one<UserBook>("SELECT * FROM user_books WHERE user_id = $1 AND book_id = $2", [
    userId,
    bookId,
  ]);
}

export async function getBookReviews(bookId: string, limit = 20): Promise<DiaryEntry[]> {
  const logs = await query<any>(
    `SELECT rl.*, p.username, p.display_name, p.avatar_url
     FROM reading_logs rl JOIN profiles p ON p.id = rl.user_id
     WHERE rl.book_id = $1 AND rl.visibility = 'public'
     ORDER BY rl.log_date DESC LIMIT $2`,
    [bookId, limit]
  );
  return hydrateLogs(logs);
}

export async function getBookLists(bookId: string) {
  return query<BookList & { username: string; display_name: string | null }>(
    `SELECT bl.*, p.username, p.display_name
     FROM book_list_items bli
     JOIN book_lists bl ON bl.id = bli.list_id
     JOIN profiles p ON p.id = bl.user_id
     WHERE bli.book_id = $1 AND bl.visibility = 'public'
     ORDER BY bl.created_at DESC`,
    [bookId]
  );
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  return one<Profile>("SELECT * FROM profiles WHERE username = $1", [username]);
}

export async function getProfileById(id: string): Promise<Profile | null> {
  return one<Profile>("SELECT * FROM profiles WHERE id = $1", [id]);
}

export async function getProfileCounts(userId: string): Promise<Record<string, number>> {
  const rows = await query<{ status: string; n: number }>(
    "SELECT status, COUNT(*)::int AS n FROM user_books WHERE user_id = $1 GROUP BY status",
    [userId]
  );
  const counts: Record<string, number> = {
    want_to_read: 0,
    reading: 0,
    read: 0,
    paused: 0,
    dnf: 0,
  };
  for (const r of rows) counts[r.status] = r.n;
  return counts;
}

export async function getFollowCounts(
  userId: string
): Promise<{ followers: number; following: number }> {
  const row = await one<{ followers: number; following: number }>(
    `SELECT
       (SELECT COUNT(*)::int FROM follows WHERE following_id = $1) AS followers,
       (SELECT COUNT(*)::int FROM follows WHERE follower_id = $1) AS following`,
    [userId]
  );
  return { followers: row?.followers ?? 0, following: row?.following ?? 0 };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const row = await one("SELECT 1 AS x FROM follows WHERE follower_id = $1 AND following_id = $2", [
    followerId,
    followingId,
  ]);
  return !!row;
}

export async function getUserDiary(
  userId: string,
  viewerId: string | null,
  limit = 50
): Promise<DiaryEntry[]> {
  const onlyPublic = viewerId !== userId;
  const rows = await query<any>(
    `SELECT rl.*, p.username, p.display_name, p.avatar_url
     FROM reading_logs rl JOIN profiles p ON p.id = rl.user_id
     WHERE rl.user_id = $1
     ${onlyPublic ? "AND rl.visibility = 'public'" : ""}
     ORDER BY rl.log_date DESC, rl.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return hydrateLogs(rows);
}

export async function getUserLibrary(userId: string, status?: string) {
  const rows = status
    ? await query<UserBook>(
        "SELECT * FROM user_books WHERE user_id = $1 AND status = $2 ORDER BY updated_at DESC",
        [userId, status]
      )
    : await query<UserBook>("SELECT * FROM user_books WHERE user_id = $1 ORDER BY updated_at DESC", [
        userId,
      ]);

  const bookIds = rows.map((r) => r.book_id);
  const authors = await attachAuthors(bookIds);
  const bookMap = new Map<string, Book>();
  if (bookIds.length) {
    const books = await query<Book>(
      `SELECT * FROM books WHERE id IN (${placeholders(bookIds.length)})`,
      bookIds
    );
    for (const b of books) bookMap.set(b.id, b);
  }
  return rows
    .map((ub) => {
      const book = bookMap.get(ub.book_id);
      if (!book) return null;
      return { userBook: ub, book: toSearchResult(book, authors.get(book.id) ?? []) };
    })
    .filter(Boolean) as { userBook: UserBook; book: BookSearchResult }[];
}

export async function getUserLists(userId: string) {
  return query<BookList & { itemCount: number }>(
    `SELECT bl.*, (SELECT COUNT(*)::int FROM book_list_items WHERE list_id = bl.id) AS "itemCount"
     FROM book_lists bl WHERE bl.user_id = $1 ORDER BY bl.created_at DESC`,
    [userId]
  );
}

export async function getPublicListsForUser(userId: string) {
  return query<BookList & { itemCount: number }>(
    `SELECT bl.*, (SELECT COUNT(*)::int FROM book_list_items WHERE list_id = bl.id) AS "itemCount"
     FROM book_lists bl WHERE bl.user_id = $1 AND bl.visibility = 'public'
     ORDER BY bl.created_at DESC`,
    [userId]
  );
}

export async function getBookList(listId: string) {
  const list = await one<
    BookList & { username: string; display_name: string | null; avatar_url: string | null }
  >(
    `SELECT bl.*, p.username, p.display_name, p.avatar_url
     FROM book_lists bl JOIN profiles p ON p.id = bl.user_id WHERE bl.id = $1`,
    [listId]
  );
  if (!list) return null;

  const items = await query<Book & { item_id: string; position: number; note: string | null }>(
    `SELECT bli.id AS item_id, bli.position, bli.note, b.*
     FROM book_list_items bli JOIN books b ON b.id = bli.book_id
     WHERE bli.list_id = $1 ORDER BY bli.position ASC`,
    [listId]
  );

  const authors = await attachAuthors(items.map((i) => i.id));
  const likeRow = await one<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM likes WHERE target_type = 'list' AND target_id = $1",
    [listId]
  );

  return {
    list,
    likeCount: likeRow?.n ?? 0,
    items: items.map((i) => ({
      itemId: i.item_id,
      position: i.position,
      note: i.note,
      book: toSearchResult(i, authors.get(i.id) ?? []),
    })),
  };
}

export async function getReadingLogById(logId: string): Promise<DiaryEntry | null> {
  const rows = await query<any>(
    `SELECT rl.*, p.username, p.display_name, p.avatar_url
     FROM reading_logs rl JOIN profiles p ON p.id = rl.user_id WHERE rl.id = $1`,
    [logId]
  );
  const hydrated = await hydrateLogs(rows);
  return hydrated[0] ?? null;
}

export async function hasLiked(
  userId: string,
  targetType: string,
  targetId: string
): Promise<boolean> {
  const row = await one(
    "SELECT 1 AS x FROM likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3",
    [userId, targetType, targetId]
  );
  return !!row;
}

export async function getLikeCount(targetType: string, targetId: string): Promise<number> {
  const row = await one<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM likes WHERE target_type = $1 AND target_id = $2",
    [targetType, targetId]
  );
  return row?.n ?? 0;
}

export async function getHomeFeed(userId: string, limit = 40): Promise<FeedItem[]> {
  const events = await query<any>(
    `SELECT ae.*, p.username, p.display_name, p.avatar_url
     FROM activity_events ae JOIN profiles p ON p.id = ae.user_id
     WHERE ae.visibility = 'public'
       AND ae.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
     ORDER BY ae.created_at DESC LIMIT $2`,
    [userId, limit]
  );
  if (events.length === 0) return [];

  const bookIds = [...new Set(events.map((e) => e.book_id).filter(Boolean))] as string[];
  const authors = await attachAuthors(bookIds);
  const bookMap = new Map<string, Book>();
  if (bookIds.length) {
    const books = await query<Book>(
      `SELECT * FROM books WHERE id IN (${placeholders(bookIds.length)})`,
      bookIds
    );
    for (const b of books) bookMap.set(b.id, b);
  }

  // Bulk-fetch referenced logs and quotes to avoid N+1.
  const logIds = events.filter((e) => e.target_type === "reading_log").map((e) => e.target_id);
  const quoteIds = events.filter((e) => e.target_type === "quote").map((e) => e.target_id);
  const logMap = new Map<string, { review_text: string | null; rating: number | null }>();
  if (logIds.length) {
    const rows = await query<{ id: string; review_text: string | null; rating: number | null }>(
      `SELECT id, review_text, rating FROM reading_logs WHERE id IN (${placeholders(logIds.length)})`,
      logIds
    );
    for (const r of rows) logMap.set(r.id, { review_text: r.review_text, rating: r.rating });
  }
  const quoteMap = new Map<string, string>();
  if (quoteIds.length) {
    const rows = await query<{ id: string; quote_text: string }>(
      `SELECT id, quote_text FROM quotes WHERE id IN (${placeholders(quoteIds.length)})`,
      quoteIds
    );
    for (const r of rows) quoteMap.set(r.id, r.quote_text);
  }

  return events.map((e) => {
    const log = e.target_type === "reading_log" ? logMap.get(e.target_id) : undefined;
    const book = e.book_id ? bookMap.get(e.book_id) : null;
    return {
      id: e.id,
      user_id: e.user_id,
      event_type: e.event_type,
      target_type: e.target_type,
      target_id: e.target_id,
      book_id: e.book_id,
      metadata: e.metadata,
      created_at: e.created_at,
      actor: { username: e.username, display_name: e.display_name, avatar_url: e.avatar_url },
      book: book ? toSearchResult(book, authors.get(book.id) ?? []) : null,
      review_text: log?.review_text ?? null,
      rating: log?.rating ?? null,
      quote_text: e.target_type === "quote" ? quoteMap.get(e.target_id) ?? null : null,
    } as FeedItem;
  });
}

export async function getExploreBooks(limit = 12): Promise<BookSearchResult[]> {
  return searchBooks("", limit);
}

export async function getExploreLists(limit = 12) {
  return query<BookList & { username: string; display_name: string | null; itemCount: number }>(
    `SELECT bl.*, p.username, p.display_name,
       (SELECT COUNT(*)::int FROM book_list_items WHERE list_id = bl.id) AS "itemCount"
     FROM book_lists bl JOIN profiles p ON p.id = bl.user_id
     WHERE bl.visibility = 'public' ORDER BY bl.created_at DESC LIMIT $1`,
    [limit]
  );
}

export async function getLocalBookIdsByWorkKeys(
  workKeys: string[]
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  if (workKeys.length === 0) return map;
  const rows = await query<{ id: string; open_library_work_key: string }>(
    `SELECT id, open_library_work_key FROM books WHERE open_library_work_key IN (${placeholders(
      workKeys.length
    )})`,
    workKeys
  );
  for (const r of rows) map[r.open_library_work_key] = r.id;
  return map;
}

async function hydrateQuotes(rows: any[]): Promise<Quote[]> {
  if (rows.length === 0) return [];
  const bookIds = rows.map((r) => r.book_id).filter(Boolean);
  const authors = await attachAuthors(bookIds);
  const bookMap = new Map<string, Book>();
  if (bookIds.length) {
    const books = await query<Book>(
      `SELECT * FROM books WHERE id IN (${placeholders(bookIds.length)})`,
      bookIds
    );
    for (const b of books) bookMap.set(b.id, b);
  }
  return rows.map((r) => {
    const book = r.book_id ? bookMap.get(r.book_id) : null;
    const bookAuthors = r.book_id ? authors.get(r.book_id) ?? [] : [];
    return {
      id: r.id,
      user_id: r.user_id,
      book_id: r.book_id,
      quote_text: r.quote_text,
      page: r.page,
      note: r.note,
      visibility: r.visibility,
      created_at: r.created_at,
      book: book ? toSearchResult(book, bookAuthors) : null,
      author_names: bookAuthors.map((a) => a.name).join(", ") || null,
      actor:
        r.username !== undefined
          ? { username: r.username, display_name: r.display_name, avatar_url: r.avatar_url }
          : undefined,
    } as Quote;
  });
}

export async function getBookQuotes(bookId: string, limit = 20): Promise<Quote[]> {
  const rows = await query<any>(
    `SELECT q.*, p.username, p.display_name, p.avatar_url
     FROM quotes q JOIN profiles p ON p.id = q.user_id
     WHERE q.book_id = $1 AND q.visibility = 'public'
     ORDER BY q.created_at DESC LIMIT $2`,
    [bookId, limit]
  );
  return hydrateQuotes(rows);
}

export async function getUserQuotes(
  userId: string,
  viewerId: string | null,
  limit = 100
): Promise<Quote[]> {
  const onlyPublic = viewerId !== userId;
  const rows = await query<any>(
    `SELECT q.*, p.username, p.display_name, p.avatar_url
     FROM quotes q JOIN profiles p ON p.id = q.user_id
     WHERE q.user_id = $1
     ${onlyPublic ? "AND q.visibility = 'public'" : ""}
     ORDER BY q.created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return hydrateQuotes(rows);
}

export async function getQuoteCount(userId: string, onlyPublic = false): Promise<number> {
  const row = await one<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM quotes WHERE user_id = $1${
      onlyPublic ? " AND visibility = 'public'" : ""
    }`,
    [userId]
  );
  return row?.n ?? 0;
}

export async function getAllTags(): Promise<Tag[]> {
  return query<Tag>("SELECT id, name, slug FROM tags ORDER BY name");
}

export async function getUserStats(userId: string) {
  const year = new Date().getFullYear();
  const counts = await getProfileCounts(userId);

  const finished = await query<{
    rating: number | null;
    format: string | null;
    page_count: number | null;
    finished_at: string | null;
    log_date: string;
  }>(
    `SELECT rl.rating, rl.format, b.page_count, rl.finished_at, rl.log_date
     FROM reading_logs rl JOIN books b ON b.id = rl.book_id
     WHERE rl.user_id = $1 AND rl.status = 'finished'`,
    [userId]
  );

  const thisYear = finished.filter((f) => (f.finished_at ?? f.log_date ?? "").startsWith(String(year)));
  const pagesThisYear = thisYear.reduce((sum, f) => sum + (f.page_count ?? 0), 0);
  const rated = finished.filter((f) => f.rating != null);
  const avgRating = rated.length
    ? rated.reduce((s, f) => s + (f.rating ?? 0), 0) / rated.length
    : null;

  const formatBreakdown: Record<string, number> = {};
  for (const f of finished) {
    if (f.format) formatBreakdown[f.format] = (formatBreakdown[f.format] ?? 0) + 1;
  }

  const topTags = await query<{ name: string; slug: string; n: number }>(
    `SELECT t.name, t.slug, COUNT(*)::int AS n
     FROM reading_log_tags rlt
     JOIN tags t ON t.id = rlt.tag_id
     JOIN reading_logs rl ON rl.id = rlt.reading_log_id
     WHERE rl.user_id = $1 GROUP BY t.id, t.name, t.slug ORDER BY n DESC LIMIT 8`,
    [userId]
  );

  return {
    year,
    counts,
    booksReadThisYear: thisYear.length,
    booksReadTotal: finished.length,
    pagesThisYear,
    avgRating,
    formatBreakdown,
    topTags,
  };
}

async function hydrateLogs(rows: any[]): Promise<DiaryEntry[]> {
  if (rows.length === 0) return [];
  const bookIds = rows.map((r) => r.book_id);
  const authors = await attachAuthors(bookIds);
  const bookMap = new Map<string, Book>();
  const books = await query<Book>(
    `SELECT * FROM books WHERE id IN (${placeholders(bookIds.length)})`,
    bookIds
  );
  for (const b of books) bookMap.set(b.id, b);

  const logIds = rows.map((r) => r.id);
  const tagMap = new Map<string, Tag[]>();
  if (logIds.length) {
    const tagRows = await query<{ reading_log_id: string; id: string; name: string; slug: string }>(
      `SELECT rlt.reading_log_id, t.id, t.name, t.slug
       FROM reading_log_tags rlt JOIN tags t ON t.id = rlt.tag_id
       WHERE rlt.reading_log_id IN (${placeholders(logIds.length)})`,
      logIds
    );
    for (const tr of tagRows) {
      if (!tagMap.has(tr.reading_log_id)) tagMap.set(tr.reading_log_id, []);
      tagMap.get(tr.reading_log_id)!.push({ id: tr.id, name: tr.name, slug: tr.slug });
    }
  }

  return rows.map((r) => {
    const book = bookMap.get(r.book_id)!;
    const bookAuthors = authors.get(r.book_id) ?? [];
    return {
      ...(r as any),
      book: toSearchResult(book, bookAuthors),
      tags: tagMap.get(r.id) ?? [],
      author_names: bookAuthors.map((a) => a.name).join(", ") || null,
    } as DiaryEntry;
  });
}
