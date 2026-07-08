"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchInput({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={submit} className="flex gap-2" role="search">
      <input
        type="search"
        className="input"
        placeholder="Search books, authors, people, lists…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search"
        autoFocus
      />
      <button type="submit" className="btn-primary shrink-0">
        Search
      </button>
    </form>
  );
}
