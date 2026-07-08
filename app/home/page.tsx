import ActivityItem from "@/components/ActivityItem";
import EmptyState from "@/components/EmptyState";
import { requireUser } from "@/lib/auth/currentUser";
import { getHomeFeed } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUser();
  const feed = await getHomeFeed(user.id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-cream">Home</h1>
        <p className="text-sm text-cream/60">Recent activity from readers you follow.</p>
      </div>

      {feed.length === 0 ? (
        <EmptyState
          icon="👋"
          title="Your feed is quiet"
          description="Follow a few readers to see what they're logging, reviewing, and listing."
          actionLabel="Find people"
          actionHref="/explore"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {feed.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
