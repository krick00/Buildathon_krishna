export default function TagPill({ name }: { name: string }) {
  return <span className="chip">#{name.toLowerCase().replace(/\s+/g, "-")}</span>;
}
