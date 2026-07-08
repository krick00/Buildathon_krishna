"use client";

import { useState } from "react";

export default function BookCover({
  src,
  title,
  className = "",
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-md bg-ink-soft ${className}`}
      aria-hidden={!showImage}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Cover of ${title}`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
          <span className="text-lg">📖</span>
          <span className="line-clamp-3 text-[10px] font-medium leading-tight text-cream/60">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
