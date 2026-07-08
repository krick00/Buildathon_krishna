export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Deterministic UUID-ish id without external deps. Good enough for local MVP rows.
export function newId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_LABELS: Record<string, string> = {
  want_to_read: "Want to Read",
  reading: "Reading",
  read: "Read",
  paused: "Paused",
  dnf: "Did Not Finish",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

const EVENT_LABELS: Record<string, string> = {
  book_added: "added",
  book_started: "started reading",
  book_finished: "finished",
  book_dnf: "did not finish",
  review_created: "reviewed",
  rating_created: "rated",
  list_created: "created a list",
  list_liked: "liked a list",
  review_liked: "liked a review",
  quote_added: "saved a quote from",
};

export function eventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00Z` : dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < 0) return formatDate(dateStr);
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  return formatDate(dateStr);
}

export function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
