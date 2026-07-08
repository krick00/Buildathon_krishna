import Link from "next/link";
import BookCover from "./BookCover";
import type { BookSearchResult } from "@/types";

export default function BookCard({ book }: { book: BookSearchResult }) {
  const authors = book.authors.map((a) => a.name).join(", ");
  return (
    <Link
      href={`/book/${book.id}`}
      className="group flex flex-col gap-2 rounded-lg p-2 transition-colors hover:bg-ink-soft"
    >
      <BookCover
        src={book.coverUrl}
        title={book.title}
        className="aspect-[2/3] w-full shadow-md ring-1 ring-black/40 transition-transform group-hover:-translate-y-0.5"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-cream" title={book.title}>
          {book.title}
        </p>
        <p className="truncate text-xs text-cream/55" title={authors}>
          {authors || "Unknown author"}
          {book.firstPublishYear ? ` · ${book.firstPublishYear}` : ""}
        </p>
      </div>
    </Link>
  );
}
