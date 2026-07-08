import Link from "next/link";
import BookCover from "./BookCover";
import RatingStars from "./RatingStars";
import TagPill from "./TagPill";
import { formatDate, statusLabel } from "@/lib/utils";
import type { DiaryEntry } from "@/types";
import { deleteLogAction } from "@/app/actions";

const LOG_STATUS_LABEL: Record<string, string> = {
  started: "Started",
  progress: "Progress",
  finished: "Finished",
  dnf: "Did not finish",
  paused: "Paused",
  note: "Note",
};

export default function DiaryEntryCard({
  entry,
  showOwnerActions = false,
}: {
  entry: DiaryEntry;
  showOwnerActions?: boolean;
}) {
  const statusText = entry.status ? LOG_STATUS_LABEL[entry.status] ?? entry.status : null;

  return (
    <article className="card flex gap-4 p-4">
      <Link href={`/book/${entry.book.id}`} className="shrink-0">
        <BookCover src={entry.book.coverUrl} title={entry.book.title} className="h-24 w-16" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Link href={`/book/${entry.book.id}`} className="font-medium text-cream hover:underline">
            {entry.book.title}
          </Link>
          <time className="text-xs text-cream/50">{formatDate(entry.log_date)}</time>
        </div>
        <p className="text-xs text-cream/55">
          {entry.author_names ?? "Unknown author"}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <RatingStars rating={entry.rating} />
          {statusText && (
            <span className="chip">
              {statusText}
              {entry.is_reread ? " · reread" : ""}
            </span>
          )}
          {entry.format && <span className="chip">{entry.format}</span>}
          {entry.visibility !== "public" && (
            <span className="chip border-accent/40 text-accent/90">{entry.visibility}</span>
          )}
        </div>

        {entry.review_text && (
          <div className="mt-2 text-sm text-cream/80">
            {entry.contains_spoilers ? (
              <details className="rounded-lg border border-ink-line bg-ink-soft/60 px-3 py-2">
                <summary className="cursor-pointer text-sm text-accent">
                  Spoilers — click to reveal
                </summary>
                <p className="mt-2">{entry.review_text}</p>
              </details>
            ) : (
              <p className="line-clamp-3">{entry.review_text}</p>
            )}
          </div>
        )}

        {entry.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.tags.map((t) => (
              <TagPill key={t.id} name={t.name} />
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center gap-4 text-xs">
          <Link href={`/log/${entry.id}`} className="text-cream/50 hover:text-cream">
            View →
          </Link>
          {showOwnerActions && (
            <form action={deleteLogAction}>
              <input type="hidden" name="logId" value={entry.id} />
              <button type="submit" className="text-red-400/70 hover:text-red-400">
                Delete
              </button>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}
