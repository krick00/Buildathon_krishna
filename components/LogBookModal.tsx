"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLogAction } from "@/app/actions";

const LOG_STATUSES = [
  { value: "finished", label: "Finished" },
  { value: "dnf", label: "Did not finish" },
  { value: "progress", label: "Progress update" },
  { value: "started", label: "Started" },
  { value: "note", label: "Note" },
];

const FORMATS = ["paperback", "hardcover", "ebook", "audiobook", "library", "arc", "other"];

export default function LogBookModal({
  bookId,
  bookTitle,
  tagSuggestions = [],
  variant = "primary",
  label = "Log this book",
}: {
  bookId: string;
  bookTitle: string;
  tagSuggestions?: string[];
  variant?: "primary" | "soft";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function submit(formData: FormData) {
    setError(null);
    formData.set("bookId", bookId);
    formData.set("rating", rating ? String(rating) : "");
    formData.set("tags", tags);
    startTransition(async () => {
      const res = await createLogAction(formData);
      if (res?.ok) {
        setOpen(false);
        setRating(0);
        setTags("");
        router.refresh();
      } else {
        setError(res?.error ?? "Something went wrong");
      }
    });
  }

  function addSuggestion(tag: string) {
    const parts = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (!parts.includes(tag)) setTags([...parts, tag].join(", "));
  }

  return (
    <>
      <button
        type="button"
        className={variant === "primary" ? "btn-primary" : "btn-soft"}
        onClick={() => setOpen(true)}
      >
        ✎ {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Log ${bookTitle}`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-ink-line bg-ink-card p-5 sm:rounded-2xl"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-cream">Log a reading</h2>
                <p className="text-sm text-cream/60">{bookTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-cream/60 hover:bg-ink-soft hover:text-cream"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form action={submit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="status">
                    Status
                  </label>
                  <select id="status" name="status" className="input" defaultValue="finished">
                    {LOG_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="logDate">
                    Date
                  </label>
                  <input
                    id="logDate"
                    name="logDate"
                    type="date"
                    className="input"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Rating</label>
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? star - 0.5 : star)}
                      className={`text-2xl leading-none transition-colors ${
                        star <= rating ? "text-accent" : star - 0.5 === rating ? "text-accent/70" : "text-cream/25"
                      }`}
                      aria-label={`${star} stars`}
                    >
                      {star - 0.5 === rating ? "⯪" : "★"}
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-cream/60">
                    {rating ? `${rating} / 5` : "No rating"}
                  </span>
                  {rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setRating(0)}
                      className="ml-1 text-xs text-cream/40 underline"
                    >
                      clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="label" htmlFor="reviewText">
                  Review
                </label>
                <textarea
                  id="reviewText"
                  name="reviewText"
                  rows={4}
                  className="input resize-none"
                  placeholder="What did you think?"
                />
              </div>

              <div>
                <label className="label" htmlFor="tags">
                  Tags (comma separated)
                </label>
                <input
                  id="tags"
                  name="tags"
                  className="input"
                  placeholder="cozy, made-me-cry, reread"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                {tagSuggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tagSuggestions.slice(0, 10).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addSuggestion(t)}
                        className="chip hover:border-accent hover:text-accent"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="format">
                    Format
                  </label>
                  <select id="format" name="format" className="input" defaultValue="">
                    <option value="">—</option>
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="visibility">
                    Visibility
                  </label>
                  <select id="visibility" name="visibility" className="input" defaultValue="public">
                    <option value="public">Public</option>
                    <option value="followers">Followers</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-cream/80">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="containsSpoilers" className="accent-accent" />
                  Contains spoilers
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="isReread" className="accent-accent" />
                  Reread
                </label>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              <div className="mt-1 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={pending}>
                  {pending ? "Saving…" : "Save log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
