import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { requireUser } from "@/lib/auth/currentUser";
import { getUserLists } from "@/lib/db/queries";
import { createListAction, deleteListAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const user = await requireUser();
  const lists = await getUserLists(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-cream">Your lists</h1>
        <p className="text-sm text-cream/60">Curated collections you can share with other readers.</p>
      </div>

      <form action={createListAction} className="card flex flex-col gap-3 p-4">
        <h2 className="font-semibold text-cream">Create a list</h2>
        <div>
          <label className="label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            className="input"
            placeholder="e.g. Books that feel like a fever dream"
          />
        </div>
        <div>
          <label className="label" htmlFor="description">
            Description
          </label>
          <input id="description" name="description" className="input" placeholder="Optional" />
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="w-40">
            <label className="label" htmlFor="visibility">
              Visibility
            </label>
            <select id="visibility" name="visibility" className="input" defaultValue="public">
              <option value="public">Public</option>
              <option value="followers">Followers</option>
              <option value="private">Private</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Create list
          </button>
        </div>
      </form>

      {lists.length === 0 ? (
        <EmptyState icon="🗂️" title="No lists yet" description="Create your first list above." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lists.map((l) => (
            <div key={l.id} className="card flex flex-col p-4">
              <Link href={`/list/${l.id}`} className="hover:underline">
                <h3 className="font-medium text-cream">{l.title}</h3>
              </Link>
              {l.description && (
                <p className="mt-1 line-clamp-2 text-sm text-cream/60">{l.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-cream/45">
                  {l.itemCount} books · {l.visibility}
                </span>
                <form action={deleteListAction}>
                  <input type="hidden" name="listId" value={l.id} />
                  <button type="submit" className="text-xs text-red-400/70 hover:text-red-400">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
