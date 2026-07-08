"use client";

import { useTransition } from "react";
import { toggleLikeAction } from "@/app/actions";

export default function LikeButton({
  targetType,
  targetId,
  liked,
  count,
}: {
  targetType: "reading_log" | "list";
  targetId: string;
  liked: boolean;
  count: number;
}) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    const fd = new FormData();
    fd.set("targetType", targetType);
    fd.set("targetId", targetId);
    fd.set("liked", String(liked));
    startTransition(() => {
      toggleLikeAction(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
        liked
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-ink-line bg-ink-soft text-cream/70 hover:text-cream"
      }`}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}
