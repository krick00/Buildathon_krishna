import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="text-4xl">🔎</span>
      <h2 className="text-lg font-semibold text-cream">Page not found</h2>
      <p className="max-w-md text-sm text-cream/60">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link href="/home" className="btn-primary mt-2">
        Back to home
      </Link>
    </div>
  );
}
