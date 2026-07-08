import DiaryEntryCard from "@/components/DiaryEntryCard";
import EmptyState from "@/components/EmptyState";
import { requireUser } from "@/lib/auth/currentUser";
import { getUserDiary } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function DiaryPage() {
  const user = await requireUser();
  const entries = await getUserDiary(user.id, user.id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-cream">Your diary</h1>
        <p className="text-sm text-cream/60">
          Every reading you&apos;ve logged, newest first. Private entries are only visible to you.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon="📓"
          title="No diary entries yet"
          description="Log a book from its page to start your reading diary."
          actionLabel="Find a book"
          actionHref="/search"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <DiaryEntryCard key={e.id} entry={e} showOwnerActions />
          ))}
        </div>
      )}
    </div>
  );
}
