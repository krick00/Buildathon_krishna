import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import BookCover from "@/components/BookCover";
import RatingStars from "@/components/RatingStars";
import TagPill from "@/components/TagPill";
import LikeButton from "@/components/LikeButton";
import { getSessionUser } from "@/lib/auth/currentUser";
import { getReadingLogById, getProfileById, hasLiked, getLikeCount } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getReadingLogById(id);
  if (!entry) notFound();

  const viewer = await getSessionUser();
  const isOwner = viewer?.id === entry.user_id;
  if (!isOwner && entry.visibility === "private") notFound();

  const [author, liked, likeCount] = await Promise.all([
    getProfileById(entry.user_id),
    viewer ? hasLiked(viewer.id, "reading_log", id) : Promise.resolve(false),
    getLikeCount("reading_log", id),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {author && (
        <Link href={`/u/${author.username}`} className="flex items-center gap-2 hover:underline">
          <Avatar src={author.avatar_url} name={author.display_name} size={32} />
          <span className="text-sm text-cream/80">{author.display_name}</span>
        </Link>
      )}

      <div className="flex gap-5">
        <Link href={`/book/${entry.book.id}`} className="shrink-0">
          <BookCover src={entry.book.coverUrl} title={entry.book.title} className="h-40 w-28 shadow-lg" />
        </Link>
        <div>
          <Link href={`/book/${entry.book.id}`}>
            <h1 className="text-2xl font-bold text-cream hover:underline">{entry.book.title}</h1>
          </Link>
          <p className="text-cream/60">{entry.author_names ?? "Unknown author"}</p>
          <div className="mt-2">
            <RatingStars rating={entry.rating} size="md" />
          </div>
          <p className="mt-2 text-sm text-cream/55">
            Logged {formatDate(entry.log_date)}
            {entry.is_reread ? " · reread" : ""}
            {entry.format ? ` · ${entry.format}` : ""}
          </p>
        </div>
      </div>

      {entry.review_text ? (
        <div className="text-[15px] leading-relaxed text-cream/90">
          {entry.contains_spoilers ? (
            <details className="rounded-lg border border-ink-line bg-ink-soft/60 px-4 py-3">
              <summary className="cursor-pointer text-accent">Spoilers — click to reveal</summary>
              <p className="mt-2 whitespace-pre-wrap">{entry.review_text}</p>
            </details>
          ) : (
            <p className="whitespace-pre-wrap">{entry.review_text}</p>
          )}
        </div>
      ) : (
        <p className="text-cream/50">No written review.</p>
      )}

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <TagPill key={t.id} name={t.name} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-ink-line pt-4">
        <LikeButton targetType="reading_log" targetId={entry.id} liked={liked} count={likeCount} />
        {entry.visibility !== "public" && (
          <span className="chip border-accent/40 text-accent/90">{entry.visibility}</span>
        )}
      </div>
    </div>
  );
}
