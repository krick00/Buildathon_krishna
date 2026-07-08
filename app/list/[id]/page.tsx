import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import BookCover from "@/components/BookCover";
import LikeButton from "@/components/LikeButton";
import { getSessionUser } from "@/lib/auth/currentUser";
import { getBookList, hasLiked } from "@/lib/db/queries";
import { removeBookFromListAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getBookList(id);
  if (!data) notFound();

  const { list, items, likeCount } = data;
  const viewer = await getSessionUser();
  const isOwner = viewer?.id === list.user_id;
  const liked = viewer ? await hasLiked(viewer.id, "list", id) : false;

  // Respect visibility for non-owners.
  if (!isOwner && list.visibility === "private") notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-cream sm:text-3xl">{list.title}</h1>
        {list.description && <p className="max-w-2xl text-cream/70">{list.description}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/u/${list.username}`} className="flex items-center gap-2 hover:underline">
            <Avatar src={list.avatar_url} name={list.display_name} size={28} />
            <span className="text-sm text-cream/80">@{list.username}</span>
          </Link>
          <span className="text-sm text-cream/45">· {items.length} books</span>
          <LikeButton targetType="list" targetId={list.id} liked={liked} count={likeCount} />
        </div>
      </header>

      {items.length === 0 ? (
        <p className="text-cream/60">This list has no books yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((it, idx) => (
            <li key={it.itemId} className="card flex items-center gap-4 p-4">
              <span className="w-6 shrink-0 text-center text-lg font-semibold text-cream/40">
                {idx + 1}
              </span>
              <Link href={`/book/${it.book.id}`} className="shrink-0">
                <BookCover src={it.book.coverUrl} title={it.book.title} className="h-20 w-14" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/book/${it.book.id}`} className="font-medium text-cream hover:underline">
                  {it.book.title}
                </Link>
                <p className="text-xs text-cream/55">
                  {it.book.authors.map((a) => a.name).join(", ") || "Unknown author"}
                </p>
                {it.note && <p className="mt-1 text-sm text-cream/70">{it.note}</p>}
              </div>
              {isOwner && (
                <form action={removeBookFromListAction}>
                  <input type="hidden" name="listItemId" value={it.itemId} />
                  <button type="submit" className="text-xs text-red-400/70 hover:text-red-400">
                    Remove
                  </button>
                </form>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
