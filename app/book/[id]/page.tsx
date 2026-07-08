import Link from "next/link";
import { notFound } from "next/navigation";
import BookCover from "@/components/BookCover";
import RatingStars from "@/components/RatingStars";
import StatusButton from "@/components/StatusButton";
import LogBookModal from "@/components/LogBookModal";
import AddToListButton from "@/components/AddToListButton";
import AddQuoteButton from "@/components/AddQuoteButton";
import DiaryEntryCard from "@/components/DiaryEntryCard";
import QuoteCard from "@/components/QuoteCard";
import EmptyState from "@/components/EmptyState";
import { getSessionUser } from "@/lib/auth/currentUser";
import {
  getBookById,
  getBookLists,
  getBookQuotes,
  getBookRatingSummary,
  getBookReviews,
  getUserBook,
  getUserLists,
  getAllTags,
} from "@/lib/db/queries";
import { parseJsonArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) notFound();

  const viewer = await getSessionUser();
  const [userBook, rating, reviews, quotes, lists, myListsRaw, tags] = await Promise.all([
    viewer ? getUserBook(viewer.id, id) : Promise.resolve(null),
    getBookRatingSummary(id),
    getBookReviews(id),
    getBookQuotes(id),
    getBookLists(id),
    viewer ? getUserLists(viewer.id) : Promise.resolve([]),
    getAllTags(),
  ]);
  const myLists = myListsRaw.map((l) => ({ id: l.id, title: l.title }));
  const tagSuggestions = tags.map((t) => t.slug);
  const subjects = parseJsonArray(book.subjects);
  const authorNames = book.authors.map((a) => a.name).join(", ");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="mx-auto w-40 shrink-0 sm:mx-0">
          <BookCover
            src={book.cover_url}
            title={book.title}
            className="aspect-[2/3] w-full shadow-lg ring-1 ring-black/40"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-cream sm:text-3xl">{book.title}</h1>
          {book.subtitle && <p className="text-lg text-cream/70">{book.subtitle}</p>}
          <p className="mt-1 text-cream/70">
            {authorNames || "Unknown author"}
            {book.first_publish_year ? ` · ${book.first_publish_year}` : ""}
            {book.page_count ? ` · ${book.page_count} pages` : ""}
          </p>

          <div className="mt-3 flex items-center gap-3">
            <RatingStars rating={rating.avg} size="md" />
            <span className="text-sm text-cream/55">
              {rating.count > 0
                ? `${rating.avg?.toFixed(2)} avg · ${rating.count} rating${rating.count > 1 ? "s" : ""}`
                : "No ratings yet"}
            </span>
          </div>

          {book.description && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/80">
              {book.description}
            </p>
          )}

          {subjects.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {subjects.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          )}

          {viewer ? (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <LogBookModal bookId={book.id} bookTitle={book.title} tagSuggestions={tagSuggestions} />
                <AddToListButton bookId={book.id} lists={myLists} />
                <AddQuoteButton bookId={book.id} bookTitle={book.title} />
              </div>

              <div className="mt-5">
                <p className="label">Your shelf</p>
                <StatusButton
                  bookId={book.id}
                  current={userBook?.status ?? null}
                  userBookId={userBook?.id}
                />
              </div>
            </>
          ) : (
            <div className="mt-5">
              <Link href="/login" className="btn-primary">
                Log in to track, log & quote this book
              </Link>
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-cream">
          Reviews &amp; logs {reviews.length > 0 && <span className="text-cream/40">({reviews.length})</span>}
        </h2>
        {reviews.length === 0 ? (
          <EmptyState
            icon="✍️"
            title="No public logs yet"
            description="Be the first to log or review this book."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <DiaryEntryCard
                key={r.id}
                entry={r}
                showOwnerActions={viewer ? r.user_id === viewer.id : false}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-cream">
          Quotes {quotes.length > 0 && <span className="text-cream/40">({quotes.length})</span>}
        </h2>
        {quotes.length === 0 ? (
          <EmptyState icon="❝" title="No quotes yet" description="Save a memorable line from this book." />
        ) : (
          <div className="flex flex-col gap-3">
            {quotes.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                showBook={false}
                showActor
                showOwnerActions={viewer ? q.user_id === viewer.id : false}
              />
            ))}
          </div>
        )}
      </section>

      {lists.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-cream">Appears in lists</h2>
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
    </div>
  );
}
