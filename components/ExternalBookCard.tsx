import BookCover from "./BookCover";
import { importBookAction } from "@/app/actions";
import type { ExternalBook } from "@/lib/books/openLibrary";

export default function ExternalBookCard({ book }: { book: ExternalBook }) {
  const authors = book.authors.join(", ");
  return (
    <form action={importBookAction} className="group">
      <input type="hidden" name="workKey" value={book.workKey} />
      <input type="hidden" name="title" value={book.title} />
      <input type="hidden" name="authors" value={JSON.stringify(book.authors)} />
      <input type="hidden" name="coverUrl" value={book.coverUrl ?? ""} />
      <input type="hidden" name="firstPublishYear" value={book.firstPublishYear ?? ""} />
      <input type="hidden" name="pageCount" value={book.pageCount ?? ""} />
      <button
        type="submit"
        className="flex w-full flex-col gap-2 rounded-lg p-2 text-left transition-colors hover:bg-ink-soft"
        title={`Import “${book.title}” from Open Library`}
      >
        <div className="relative">
          <BookCover
            src={book.coverUrl}
            title={book.title}
            className="aspect-[2/3] w-full shadow-md ring-1 ring-black/40 transition-transform group-hover:-translate-y-0.5"
          />
          <span className="absolute right-1 top-1 rounded-full bg-ink/80 px-1.5 py-0.5 text-[9px] font-medium text-accent">
            + import
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-cream" title={book.title}>
            {book.title}
          </p>
          <p className="truncate text-xs text-cream/55" title={authors}>
            {authors || "Unknown author"}
            {book.firstPublishYear ? ` · ${book.firstPublishYear}` : ""}
          </p>
          {book.pageCount ? (
            <p className="text-[11px] text-cream/40">{book.pageCount} pages</p>
          ) : null}
        </div>
      </button>
    </form>
  );
}
