export default function Avatar({
  src,
  name,
  size = 40,
}: {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: number;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name ?? "avatar"}
        width={size}
        height={size}
        className="rounded-full bg-ink-soft object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-moss/30 font-semibold text-cream"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
