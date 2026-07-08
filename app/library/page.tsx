import Link from "next/link";
import BookCover from "@/components/BookCover";
import RatingStars from "@/components/RatingStars";
import EmptyState from "@/components/EmptyState";
import StatusButton from "@/components/StatusButton";
import { requireUser } from "@/lib/auth/currentUser";
import { getUserLibrary, getProfileCounts } from "@/lib/db/queries";
import { statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "", label: "All" },
  { value: "reading", label: "Reading" },
  { value: "want_to_read", label: "Want to Read" },
  { value: "read", label: "Read" },
  { value: "paused", label: "Paused" },
  { value: "dnf", label: "DNF" },
];

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "" } = await searchParams;
  const user = await requireUser();
  const [items, counts] = await Promise.all([
    getUserLibrary(user.id, status || undefined),
    getProfileCounts(user.id),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-cream">Your library</h1>
        <p className="text-sm text-cream/60">{total} books across all shelves.</p>
      </div>

      <div className="flex flex-wrap gap-2 overflow-x-auto">
        {TABS.map((t) => {
          const active = status === t.value;
          const count = t.value ? counts[t.value] ?? 0 : total;
          return (
            <Link
              key={t.value || "all"}
              href={t.value ? `/library?status=${t.value}` : "/library"}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                active ? "bg-accent text-ink" : "border border-ink-line bg-ink-soft text-cream/70 hover:text-cream"
              }`}
            >
              {t.label} <span className="opacity-60">{count}</span>
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="📚"
          title={status ? `Nothing in “${statusLabel(status)}”` : "Your library is empty"}
          description="Search for a book and add it to a shelf to get started."
          actionLabel="Find a book"
          actionHref="/search"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(({ userBook, book }) => (
            <div key={userBook.id} className="card flex gap-4 p-4">
              <Link href={`/book/${book.id}`} className="shrink-0">
                <BookCover src={book.coverUrl} title={book.title} className="h-24 w-16" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/book/${book.id}`} className="font-medium text-cream hover:underline">
                  {book.title}
                </Link>
                <p className="text-xs text-cream/55">
                  {book.authors.map((a) => a.name).join(", ") || "Unknown author"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="chip">{statusLabel(userBook.status)}</span>
                  <RatingStars rating={userBook.rating} />
                  {userBook.format && <span className="chip">{userBook.format}</span>}
                  {userBook.status === "reading" && userBook.progress_percent != null && (
                    <span className="text-xs text-cream/55">{userBook.progress_percent}% read</span>
                  )}
                </div>
                <div className="mt-3">
                  <StatusButton
                    bookId={book.id}
                    current={userBook.status}
                    userBookId={userBook.id}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
