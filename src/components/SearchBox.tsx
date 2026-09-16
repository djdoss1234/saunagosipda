"use client";

import { suggestions } from "@/lib/search";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export function SearchBox({
  initial = "",
  size = "lg",
  autoFocus = false,
}: {
  initial?: string;
  size?: "lg" | "md";
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const hits = q.trim() ? suggestions(q) : [];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(query = q) {
    const next = query.trim();
    setOpen(false);
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        className={`flex overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] ${
          size === "lg" ? "h-14" : "h-12"
        }`}
        onSubmit={(e) => {
          e.preventDefault();
          const hit = hits[active];
          if (open && hit) {
            if (hit.kind === "facility") router.push(`/saunas/${hit.id}`);
            else router.push(`/search?region=${hit.id}`);
            setOpen(false);
            return;
          }
          go();
        }}
      >
        <label className="sr-only" htmlFor="site-search">
          시설명·지역·키워드 검색
        </label>
        <input
          id="site-search"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !hits.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => (i + 1) % hits.length);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i - 1 + hits.length) % hits.length);
            }
          }}
          placeholder="시설명 · 지역 · 키워드"
          className="min-w-0 flex-1 bg-transparent px-5 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        <button
          type="submit"
          className="m-1 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full bg-[var(--ember)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--ember-deep)]"
        >
          <Search className="mr-1.5 size-4" aria-hidden />
          검색
        </button>
      </form>
      {open && hits.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-2 shadow-[var(--shadow-lg)]"
        >
          {hits.map((hit, i) => (
            <li key={`${hit.kind}-${hit.id}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm ${
                  i === active ? "bg-[var(--cream-2)]" : "hover:bg-[var(--cream-2)]"
                }`}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  if (hit.kind === "facility") router.push(`/saunas/${hit.id}`);
                  else router.push(`/search?region=${hit.id}`);
                  setOpen(false);
                }}
              >
                <span className="font-medium text-[var(--ink)]">{hit.label}</span>
                <span className="text-xs text-[var(--muted)]">{hit.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
