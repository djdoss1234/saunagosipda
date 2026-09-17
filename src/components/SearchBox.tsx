"use client";

import { useApp } from "@/context/AppState";
import { suggestions } from "@/lib/search";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export function SearchBox({
  initial = "",
  size = "lg",
  autoFocus = false,
  tone = "light",
}: {
  initial?: string;
  size?: "lg" | "md";
  autoFocus?: boolean;
  tone?: "light" | "hero";
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const inputId = useId();
  const { catalog } = useApp();
  const popular = [
    { kind: "region" as const, id: "seoul", label: "서울", hint: "지역" },
    { kind: "region" as const, id: "busan", label: "부산", hint: "지역" },
    { kind: "region" as const, id: "incheon", label: "인천", hint: "지역" },
    { kind: "region" as const, id: "gyeonggi", label: "경기", hint: "지역" },
  ];
  const hits = q.trim() ? suggestions(q, catalog) : tone === "hero" ? popular : [];

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
        className={`flex overflow-hidden border border-[var(--border)] bg-[color-mix(in_srgb,var(--cream-2)_55%,var(--surface))] ${
          size === "lg" ? "h-14" : "h-12"
        }`}
        onSubmit={(e) => {
          e.preventDefault();
          const hit = hits[active];
          if (open && hit && picked) {
            if (hit.kind === "facility") router.push(`/saunas/${hit.id}`);
            else router.push(`/search?region=${hit.id}`);
            setOpen(false);
            return;
          }
          go();
        }}
      >
        <label className="sr-only" htmlFor={inputId}>
          시설명·지역·키워드 검색
        </label>
        <input
          id={inputId}
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
            setPicked(false);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !hits.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setPicked(true);
              setActive((i) => (i + 1) % hits.length);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setPicked(true);
              setActive((i) => (i - 1 + hits.length) % hits.length);
            }
          }}
          placeholder="시설명 · 지역 · 키워드"
          className="min-w-0 flex-1 bg-transparent px-5 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && hits[active] ? `${listId}-opt-${active}` : undefined}
        />
        <button
          type="submit"
          className="inline-flex h-full min-w-11 cursor-pointer items-center justify-center bg-[var(--ink)] px-5 text-xs font-medium tracking-widest text-[var(--cream)] transition hover:bg-[#2a2420]"
        >
          <Search className="mr-1.5 size-4" aria-hidden />
          검색
        </button>
      </form>
      {open && hits.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden border border-[var(--border)] bg-[var(--surface)] py-1"
        >
          {hits.map((hit, i) => (
            <li key={`${hit.kind}-${hit.id}`} id={`${listId}-opt-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm ${
                  i === active ? "bg-[var(--cream-2)]" : "hover:bg-[var(--cream-2)]"
                }`}
                onMouseEnter={() => {
                  setActive(i);
                  setPicked(true);
                }}
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
