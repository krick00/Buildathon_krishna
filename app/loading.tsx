export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-7 w-40 animate-pulse rounded bg-ink-soft" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-ink-soft" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-ink-soft" />
        ))}
      </div>
    </div>
  );
}
