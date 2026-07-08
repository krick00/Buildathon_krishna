import Link from "next/link";
import BookCard from "@/components/BookCard";
import { getExploreBooks } from "@/lib/db/queries";
import { getSessionUser } from "@/lib/auth/currentUser";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [books, user] = await Promise.all([getExploreBooks(6), getSessionUser()]);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-center gap-5 rounded-2xl border border-ink-line bg-gradient-to-b from-ink-card to-ink px-6 py-14 text-center">
        <span className="chip border-accent/40 text-accent">Your reading, beautifully logged</span>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight text-cream sm:text-5xl">
          A social diary for the books you love.
        </h1>
        <p className="max-w-xl text-cream/70">
          Track what you read, write reviews, tag your moods, save favorite quotes, and follow
          readers with taste like yours. Not a database — a reading identity.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {user ? (
            <Link href="/home" className="btn-primary">
              Go to your feed
            </Link>
          ) : (
            <>
              <Link href="/signup" className="btn-primary">
                Create your account
              </Link>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-cream">Popular on Booklog</h2>
          <Link href="/explore" className="text-sm text-accent hover:underline">
            Explore all →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>
    </div>
  );
}
