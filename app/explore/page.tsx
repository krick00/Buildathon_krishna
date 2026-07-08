import Link from "next/link";
import BookCard from "@/components/BookCard";
import Avatar from "@/components/Avatar";
import { getExploreBooks, getExploreLists } from "@/lib/db/queries";
import { getAllProfiles } from "@/lib/auth/currentUser";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const [books, lists, people] = await Promise.all([
    getExploreBooks(12),
    getExploreLists(9),
    getAllProfiles(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-cream">Explore</h1>
        <p className="text-sm text-cream/60">Trending books, curated lists, and readers to follow.</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-cream">Books</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-cream">Lists</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((l) => (
            <Link key={l.id} href={`/list/${l.id}`} className="card p-4 transition-colors hover:bg-ink-soft">
              <h3 className="font-medium text-cream">{l.title}</h3>
              {l.description && (
                <p className="mt-1 line-clamp-2 text-sm text-cream/60">{l.description}</p>
              )}
              <p className="mt-3 text-xs text-cream/45">
                {l.itemCount} books · by @{l.username}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-cream">Readers</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {people.map((p) => (
            <Link
              key={p.id}
              href={`/u/${p.username}`}
              className="card flex items-center gap-3 p-4 transition-colors hover:bg-ink-soft"
            >
              <Avatar src={p.avatar_url} name={p.display_name} size={44} />
              <div>
                <p className="font-medium text-cream">{p.display_name}</p>
                <p className="text-sm text-cream/55">@{p.username}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
