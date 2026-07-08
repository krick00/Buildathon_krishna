"use client";

import { useTransition } from "react";
import { setStatusAction, removeFromLibraryAction } from "@/app/actions";
import type { BookStatus } from "@/types";

const STATUSES: { value: BookStatus; label: string; icon: string }[] = [
  { value: "want_to_read", label: "Want to Read", icon: "🔖" },
  { value: "reading", label: "Reading", icon: "📖" },
  { value: "read", label: "Read", icon: "✅" },
  { value: "paused", label: "Paused", icon: "⏸️" },
  { value: "dnf", label: "DNF", icon: "🚫" },
];

export default function StatusButton({
  bookId,
  current,
  userBookId,
}: {
  bookId: string;
  current: BookStatus | null;
  userBookId?: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function setStatus(status: BookStatus) {
    const fd = new FormData();
    fd.set("bookId", bookId);
    fd.set("status", status);
    startTransition(() => {
      setStatusAction(fd);
    });
  }

  function remove() {
    if (!userBookId) return;
    const fd = new FormData();
    fd.set("userBookId", userBookId);
    startTransition(() => {
      removeFromLibraryAction(fd);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Set reading status">
        {STATUSES.map((s) => {
          const active = current === s.value;
          return (
            <button
              key={s.value}
              type="button"
              disabled={pending}
              onClick={() => setStatus(s.value)}
              aria-pressed={active}
              className={
                active
                  ? "btn bg-accent text-ink"
                  : "btn border border-ink-line bg-ink-soft text-cream hover:bg-ink-line"
              }
            >
              <span aria-hidden>{s.icon}</span>
              {s.label}
            </button>
          );
        })}
      </div>
      {current && userBookId && (
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="self-start text-xs text-cream/50 underline hover:text-cream/80"
        >
          Remove from library
        </button>
      )}
      {pending && <span className="text-xs text-cream/50">Saving…</span>}
    </div>
  );
}
