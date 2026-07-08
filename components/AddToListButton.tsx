"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBookToListAction, createListAction } from "@/app/actions";

export default function AddToListButton({
  bookId,
  lists,
}: {
  bookId: string;
  lists: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function add(listId: string) {
    const fd = new FormData();
    fd.set("listId", listId);
    fd.set("bookId", bookId);
    startTransition(async () => {
      const res = await addBookToListAction(fd);
      setMsg(res?.ok ? "Added to list ✓" : "Already in that list");
      router.refresh();
    });
  }

  function createAndAdd(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;
    startTransition(async () => {
      await createListAction(formData);
      // Refresh will re-render parent with the new list; close for now.
      setMsg(`Created “${title}”. Open it from Lists to confirm the book.`);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button type="button" className="btn-soft" onClick={() => setOpen((o) => !o)}>
        ＋ Add to list
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-64 rounded-xl border border-ink-line bg-ink-card p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cream/50">
            Your lists
          </p>
          {lists.length === 0 && <p className="mb-2 text-sm text-cream/60">No lists yet.</p>}
          <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {lists.map((l) => (
              <button
                key={l.id}
                type="button"
                disabled={pending}
                onClick={() => add(l.id)}
                className="rounded-md px-2 py-1.5 text-left text-sm text-cream hover:bg-ink-soft"
              >
                {l.title}
              </button>
            ))}
          </div>
          <form action={createAndAdd} className="mt-2 border-t border-ink-line pt-2">
            <input name="title" className="input mb-2" placeholder="New list name" />
            <button type="submit" className="btn-primary w-full" disabled={pending}>
              Create list
            </button>
          </form>
          {msg && <p className="mt-2 text-xs text-accent">{msg}</p>}
        </div>
      )}
    </div>
  );
}
