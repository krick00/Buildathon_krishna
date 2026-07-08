import Link from "next/link";
import { notFound } from "next/navigation";
import DiaryEntryCard from "@/components/DiaryEntryCard";
import EmptyState from "@/components/EmptyState";
import { getSessionUser } from "@/lib/auth/currentUser";
import { getProfileByUsername, getUserDiary } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function PublicDiaryPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const viewer = await getSessionUser();
  const isSelf = viewer?.id === profile.id;
  const entries = await getUserDiary(profile.id, isSelf ? profile.id : null, 100);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={`/u/${profile.username}`} className="text-sm text-accent hover:underline">
          ← {profile.display_name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-cream">
          {isSelf ? "Your diary" : `${profile.display_name}'s diary`}
        </h1>
        <p className="text-sm text-cream/60">
          {isSelf ? "All entries, including private." : "Public entries only."}
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon="📖" title="No entries to show" />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <DiaryEntryCard key={e.id} entry={e} showOwnerActions={isSelf} />
          ))}
        </div>
      )}
    </div>
  );
}
