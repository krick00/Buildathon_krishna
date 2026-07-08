import QuoteCard from "@/components/QuoteCard";
import EmptyState from "@/components/EmptyState";
import { requireUser } from "@/lib/auth/currentUser";
import { getUserQuotes } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const user = await requireUser();
  const quotes = await getUserQuotes(user.id, user.id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-cream">Favorite quotes</h1>
        <p className="text-sm text-cream/60">
          Lines worth keeping. Add quotes from any book&apos;s page.
        </p>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon="❝"
          title="No quotes yet"
          description="Open a book and tap “Add a quote” to start your collection."
          actionLabel="Find a book"
          actionHref="/search"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {quotes.map((q) => (
            <QuoteCard key={q.id} quote={q} showOwnerActions />
          ))}
        </div>
      )}
    </div>
  );
}
