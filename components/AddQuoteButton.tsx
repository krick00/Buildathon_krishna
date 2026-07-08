"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuoteAction } from "@/app/actions";

export default function AddQuoteButton({
  bookId,
  bookTitle,
}: {
  bookId: string;
  bookTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    formData.set("bookId", bookId);
    startTransition(async () => {
      const res = await createQuoteAction(formData);
      if (res?.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res?.error ?? "Something went wrong");
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="btn-soft" onClick={() => setOpen(true)}>
        ❝ Add a quote
      </button>
    );
  }

  return (
    <form action={submit} className="card flex w-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-cream">Quote from {bookTitle}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-cream/60 hover:bg-ink-soft hover:text-cream"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div>
        <label className="label" htmlFor="quoteText">
          Quote
        </label>
        <textarea
          id="quoteText"
          name="quoteText"
          rows={3}
          required
          className="input resize-none"
          placeholder="A line worth keeping…"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="page">
            Page (optional)
          </label>
          <input id="page" name="page" type="number" min={0} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="quoteVisibility">
            Visibility
          </label>
          <select id="quoteVisibility" name="visibility" className="input" defaultValue="public">
            <option value="public">Public</option>
            <option value="followers">Followers</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="note">
          Note (optional)
        </label>
        <input id="note" name="note" className="input" placeholder="Why it stuck with you" />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save quote"}
        </button>
      </div>
    </form>
  );
}
