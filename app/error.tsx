"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="text-4xl">⚠️</span>
      <h2 className="text-lg font-semibold text-cream">Something went wrong</h2>
      <p className="max-w-md text-sm text-cream/60">{error.message || "An unexpected error occurred."}</p>
      <button type="button" className="btn-primary mt-2" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
