import EmptyState from "@/components/EmptyState";
import TagPill from "@/components/TagPill";
import { requireUser } from "@/lib/auth/currentUser";
import { getUserStats } from "@/lib/db/queries";
import { statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-cream/50">{label}</p>
      <p className="mt-1 text-3xl font-bold text-cream">{value}</p>
      {sub && <p className="text-xs text-cream/45">{sub}</p>}
    </div>
  );
}

export default async function StatsPage() {
  const user = await requireUser();
  const stats = await getUserStats(user.id);
  const hasData = stats.booksReadTotal > 0 || Object.values(stats.counts).some((n) => n > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-cream">Your reading stats</h1>
        <p className="text-sm text-cream/60">A snapshot of your reading life in {stats.year}.</p>
      </div>

      {!hasData ? (
        <EmptyState
          icon="📊"
          title="No stats yet"
          description="Log some finished books and your stats will appear here."
          actionLabel="Find a book"
          actionHref="/search"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label={`Read in ${stats.year}`} value={stats.booksReadThisYear} sub="books finished" />
            <StatCard label="Pages this year" value={stats.pagesThisYear.toLocaleString()} />
            <StatCard
              label="Avg rating"
              value={stats.avgRating != null ? stats.avgRating.toFixed(2) : "—"}
              sub="across finished logs"
            />
            <StatCard label="Read all time" value={stats.booksReadTotal} sub="finished logs" />
          </div>

          <section className="card p-4">
            <h2 className="mb-3 font-semibold text-cream">Shelves</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.counts).map(([status, n]) => (
                <span key={status} className="chip">
                  <strong className="mr-1 text-cream">{n}</strong>
                  {statusLabel(status)}
                </span>
              ))}
            </div>
          </section>

          {Object.keys(stats.formatBreakdown).length > 0 && (
            <section className="card p-4">
              <h2 className="mb-3 font-semibold text-cream">Formats</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.formatBreakdown).map(([fmt, n]) => (
                  <span key={fmt} className="chip">
                    <strong className="mr-1 text-cream">{n}</strong>
                    {fmt}
                  </span>
                ))}
              </div>
            </section>
          )}

          {stats.topTags.length > 0 && (
            <section className="card p-4">
              <h2 className="mb-3 font-semibold text-cream">Top tags</h2>
              <div className="flex flex-wrap gap-2">
                {stats.topTags.map((t) => (
                  <span key={t.slug} className="inline-flex items-center gap-1">
                    <TagPill name={t.name} />
                    <span className="text-xs text-cream/40">×{t.n}</span>
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
