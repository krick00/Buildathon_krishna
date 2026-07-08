import Link from "next/link";
import BookCard from "./BookCard";
import ExternalBookCard from "./ExternalBookCard";
import { searchOpenLibrary } from "@/lib/books/openLibrary";
import { getLocalBookIdsByWorkKeys } from "@/lib/db/queries";

// Async server component — streams in after the local results (wrap in <Suspense>).
export default async function ExternalResults({ query }: { query: string }) {
  const result = await searchOpenLibrary(query, 12);

  if (result.status === "unavailable") {
    return (
      <p className="text-sm text-cream/45">
        Couldn&apos;t reach Open Library right now. Local Booklog results are shown above.
      </p>
    );
  }
  if (result.books.length === 0) return null;

  const external = result.books;
  const localMap = await getLocalBookIdsByWorkKeys(external.map((b) => b.workKey));

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cream/60">
        More from Open Library
      </h2>
      <p className="mb-3 text-xs text-cream/45">
        Live results. Click a book to import it into Booklog so you can log, review, and quote it.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {external.map((b) => {
          const localId = localMap[b.workKey];
          if (localId) {
            // Already cached locally — link straight to the local page.
            return (
              <BookCard
                key={b.workKey}
                book={{
                  id: localId,
                  title: b.title,
                  subtitle: null,
                  coverUrl: b.coverUrl,
                  firstPublishYear: b.firstPublishYear,
                  authors: b.authors.map((name) => ({ id: name, name })),
                }}
              />
            );
          }
          return <ExternalBookCard key={b.workKey} book={b} />;
        })}
      </div>
    </section>
  );
}
