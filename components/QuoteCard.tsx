import Link from "next/link";
import Avatar from "./Avatar";
import { formatDate } from "@/lib/utils";
import { deleteQuoteAction } from "@/app/actions";
import type { Quote } from "@/types";

export default function QuoteCard({
  quote,
  showBook = true,
  showActor = false,
  showOwnerActions = false,
}: {
  quote: Quote;
  showBook?: boolean;
  showActor?: boolean;
  showOwnerActions?: boolean;
}) {
  return (
    <article className="card p-4">
      <blockquote className="border-l-2 border-accent pl-4 text-[15px] italic leading-relaxed text-cream/90">
        “{quote.quote_text}”
      </blockquote>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cream/55">
        {showBook && quote.book && (
          <Link href={`/book/${quote.book.id}`} className="text-cream/80 hover:underline">
            {quote.book.title}
          </Link>
        )}
        {quote.author_names && <span>· {quote.author_names}</span>}
        {quote.page != null && <span>· p. {quote.page}</span>}
        {quote.visibility !== "public" && (
          <span className="chip border-accent/40 text-accent/90">{quote.visibility}</span>
        )}
        <time className="ml-auto">{formatDate(quote.created_at)}</time>
      </div>

      {quote.note && <p className="mt-2 text-sm text-cream/70">{quote.note}</p>}

      {(showActor && quote.actor) || showOwnerActions ? (
        <div className="mt-3 flex items-center justify-between">
          {showActor && quote.actor ? (
            <Link
              href={`/u/${quote.actor.username}`}
              className="flex items-center gap-2 text-xs text-cream/60 hover:text-cream"
            >
              <Avatar src={quote.actor.avatar_url} name={quote.actor.display_name} size={20} />
              @{quote.actor.username}
            </Link>
          ) : (
            <span />
          )}
          {showOwnerActions && (
            <form action={deleteQuoteAction}>
              <input type="hidden" name="quoteId" value={quote.id} />
              <button type="submit" className="text-xs text-red-400/70 hover:text-red-400">
                Delete
              </button>
            </form>
          )}
        </div>
      ) : null}
    </article>
  );
}
