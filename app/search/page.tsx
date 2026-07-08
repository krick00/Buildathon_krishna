import { Suspense } from "react";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import Avatar from "@/components/Avatar";
import SearchInput from "@/components/SearchInput";
import ExternalResults from "@/components/ExternalResults";
import { searchBooks, searchProfiles, searchLists } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [books, people, lists] = await Promise.all([
    searchBooks(query),
    query ? searchProfiles(query) : Promise.resolve([]),
    query ? searchLists(query) : Promise.resolve([]),
  ]);
  const hasResults = books.length || people.length || lists.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-3 text-2xl font-bold text-cream">Search</h1>
        <SearchInput initial={query} />
      </div>

      {query ? (
        <>
          {!hasResults && (
            <p className="text-sm text-cream/50">
              No matches in Booklog yet for “{query}”. Checking Open Library…
            </p>
          )}
          {people.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cream/60">
                People
              </h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {people.map((p) => (
                  <Link
                    key={p.id}
                    href={`/u/${p.username}`}
                    className="card flex items-center gap-3 p-3 hover:bg-ink-soft"
                  >
                    <Avatar src={p.avatar_url} name={p.display_name} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-cream">{p.display_name}</p>
                      <p className="truncate text-xs text-cream/55">@{p.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {lists.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cream/60">
                Lists
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {lists.map((l) => (
                  <Link key={l.id} href={`/list/${l.id}`} className="card p-3 hover:bg-ink-soft">
                    <p className="font-medium text-cream">{l.title}</p>
                    <p className="text-xs text-cream/55">by @{l.username}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {books.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cream/60">
                Books in Booklog
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {books.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          )}

          <Suspense
            fallback={
              <p className="text-sm text-cream/50">Searching Open Library…</p>
            }
          >
            <ExternalResults query={query} />
          </Suspense>
        </>
      ) : (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cream/60">
            Popular books
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
