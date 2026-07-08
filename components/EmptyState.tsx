import Link from "next/link";

export default function EmptyState({
  icon = "📚",
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="text-lg font-semibold text-cream">{title}</h3>
      {description && <p className="max-w-md text-sm text-cream/60">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-2">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
