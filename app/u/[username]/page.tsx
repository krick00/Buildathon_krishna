import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import DiaryEntryCard from "@/components/DiaryEntryCard";
import EmptyState from "@/components/EmptyState";
import { getSessionUser } from "@/lib/auth/currentUser";
import {
  getProfileByUsername,
  getProfileCounts,
  getFollowCounts,
  isFollowing,
  getUserDiary,
  getPublicListsForUser,
  getUserQuotes,
} from "@/lib/db/queries";
import QuoteCard from "@/components/QuoteCard";
import { statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COUNT_ORDER = ["read", "reading", "want_to_read", "dnf"];

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const viewer = await getSessionUser();
  const isSelf = viewer?.id === profile.id;
  const [counts, follow, following, recentLogs, lists, quotes] = await Promise.all([
    getProfileCounts(profile.id),
    getFollowCounts(profile.id),
    viewer && !isSelf ? isFollowing(viewer.id, profile.id) : Promise.resolve(false),
    getUserDiary(profile.id, isSelf ? profile.id : null, 6),
    getPublicListsForUser(profile.id),
    getUserQuotes(profile.id, isSelf ? profile.id : null, 4),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar src={profile.avatar_url} name={profile.display_name} size={80} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-cream">{profile.display_name}</h1>
            {isSelf ? (
              <span className="chip">This is you</span>
            ) : viewer ? (
              <FollowButton targetId={profile.id} isFollowing={following} />
            ) : null}
          </div>
          <p className="text-cream/55">@{profile.username}</p>
          {profile.bio && <p className="mt-2 max-w-xl text-sm text-cream/80">{profile.bio}</p>}
          {profile.website && (
            <a
              href={profile.website}
              className="mt-1 inline-block text-sm text-accent hover:underline"
              rel="noreferrer noopener"
              target="_blank"
            >
              {profile.website}
            </a>
          )}

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-cream/70">
            <span>
              <strong className="text-cream">{follow.followers}</strong> followers
            </span>
            <span>
              <strong className="text-cream">{follow.following}</strong> following
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {COUNT_ORDER.map((s) => (
              <span key={s} className="chip">
                <strong className="mr-1 text-cream">{counts[s] ?? 0}</strong>
                {statusLabel(s)}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-cream">Recent diary</h2>
          <Link href={`/u/${profile.username}/diary`} className="text-sm text-accent hover:underline">
            View all →
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <EmptyState icon="📖" title="No public logs yet" />
        ) : (
          <div className="flex flex-col gap-3">
            {recentLogs.map((e) => (
              <DiaryEntryCard key={e.id} entry={e} showOwnerActions={isSelf} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-cream">Lists</h2>
        {lists.length === 0 ? (
          <EmptyState icon="🗂️" title="No public lists yet" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lists.map((l) => (
              <Link key={l.id} href={`/list/${l.id}`} className="card p-4 hover:bg-ink-soft">
                <h3 className="font-medium text-cream">{l.title}</h3>
                {l.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-cream/60">{l.description}</p>
                )}
                <p className="mt-2 text-xs text-cream/45">{l.itemCount} books</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {quotes.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-cream">Favorite quotes</h2>
          <div className="flex flex-col gap-3">
            {quotes.map((q) => (
              <QuoteCard key={q.id} quote={q} showOwnerActions={!!isSelf} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
