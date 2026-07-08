"use client";

import { useTransition } from "react";
import { toggleFollowAction } from "@/app/actions";

export default function FollowButton({
  targetId,
  isFollowing,
}: {
  targetId: string;
  isFollowing: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    const fd = new FormData();
    fd.set("targetId", targetId);
    fd.set("isFollowing", String(isFollowing));
    startTransition(() => {
      toggleFollowAction(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isFollowing}
      className={isFollowing ? "btn-ghost" : "btn-primary"}
    >
      {pending ? "…" : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
