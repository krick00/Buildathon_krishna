import "server-only";

export type ExternalBook = {
  workKey: string; // e.g. "/works/OL262758W"
  title: string;
  authors: string[];
  coverUrl: string | null;
  firstPublishYear: number | null;
  pageCount: number | null;
};

type OLDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
};

export type ExternalSearch =
  | { status: "ok"; books: ExternalBook[] }
  | { status: "unavailable" };

/**
 * Live book search against the Open Library Search API.
 * No API key required. Returns only the minimal fields we cache locally.
 * On network/timeout failure returns { status: "unavailable" } so the UI can
 * explain gracefully instead of silently showing nothing.
 */
export async function searchOpenLibrary(query: string, limit = 12): Promise<ExternalSearch> {
  const q = query.trim();
  if (!q) return { status: "ok", books: [] };

  const url =
    "https://openlibrary.org/search.json?" +
    new URLSearchParams({
      q,
      fields: "key,title,author_name,first_publish_year,cover_i,number_of_pages_median",
      limit: String(limit),
    }).toString();

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Booklog/0.1 (buildathon demo)" },
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return { status: "unavailable" };
    const json = (await res.json()) as { docs?: OLDoc[] };
    const books = (json.docs ?? [])
      .filter((d): d is OLDoc => Boolean(d.key && d.title))
      .map((d) => ({
        workKey: d.key!,
        title: d.title!,
        authors: d.author_name ?? [],
        coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
        firstPublishYear: d.first_publish_year ?? null,
        pageCount: d.number_of_pages_median ?? null,
      }));
    return { status: "ok", books };
  } catch {
    // Network/timeout/parse failure must not break the product search.
    return { status: "unavailable" };
  }
}
