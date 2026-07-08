export default function RatingStars({
  rating,
  size = "sm",
}: {
  rating: number | null | undefined;
  size?: "sm" | "md";
}) {
  if (rating == null) {
    return <span className="text-xs text-cream/40">Not rated</span>;
  }
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const textSize = size === "md" ? "text-lg" : "text-sm";

  return (
    <span
      className={`inline-flex items-center ${textSize} leading-none text-accent`}
      aria-label={`${rating} out of 5 stars`}
      title={`${rating} / 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <span key={i}>★</span>;
        if (i === full && half) return <span key={i}>⯪</span>;
        return (
          <span key={i} className="text-cream/25">
            ★
          </span>
        );
      })}
    </span>
  );
}
