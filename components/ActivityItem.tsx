import Link from "next/link";
import Avatar from "./Avatar";
import BookCover from "./BookCover";
import RatingStars from "./RatingStars";
import { eventLabel, relativeTime } from "@/lib/utils";
import type { FeedItem } from "@/types";

export default function ActivityItem({ item }: { item: FeedItem }) {
  const actorName = item.actor.display_name ?? item.actor.username;
  let metaTitle: string | null = null;
  try {
    if (item.metadata) metaTitle = JSON.parse(item.metadata).title ?? null;
  } catch {
    metaTitle = null;
  }

  return (
    <article className="card flex gap-4 p-4">
      {item.book ? (
        <Link href={`/book/${item.book.id}`} className="shrink-0">
          <BookCover src={item.book.coverUrl} title={item.book.title} className="h-24 w-16" />
        </Link>
      ) : (
        <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-ink-soft text-2xl">
          📝
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/u/${item.actor.username}`} className="flex items-center gap-2 hover:underline">
            <Avatar src={item.actor.avatar_url} name={actorName} size={24} />
            <span className="text-sm font-medium text-cream">{actorName}</span>
          </Link>
          <span className="text-sm text-cream/55">{eventLabel(item.event_type)}</span>
          <span className="ml-auto text-xs text-cream/40">{relativeTime(item.created_at)}</span>
        </div>

        {item.book ? (
          <Link href={`/book/${item.book.id}`} className="mt-1 block font-medium text-cream hover:underline">
            {item.book.title}
            {item.book.firstPublishYear ? (
              <span className="font-normal text-cream/50"> · {item.book.firstPublishYear}</span>
            ) : null}
          </Link>
        ) : metaTitle ? (
          <Link href={`/list/${item.target_id}`} className="mt-1 block font-medium text-cream hover:underline">
            {metaTitle}
          </Link>
        ) : null}

        {item.rating != null && (
          <div className="mt-1">
            <RatingStars rating={item.rating} />
          </div>
        )}
        {item.review_text && (
          <p className="mt-1 line-clamp-2 text-sm text-cream/75">{item.review_text}</p>
        )}
        {item.quote_text && (
          <blockquote className="mt-2 border-l-2 border-accent/60 pl-3 text-sm italic text-cream/80">
            “{item.quote_text}”
          </blockquote>
        )}
      </div>
    </article>
  );
}
