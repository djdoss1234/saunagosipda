"use client";

import { SearchBox } from "@/components/SearchBox";
import { useApp } from "@/context/AppState";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/search", label: "사우나 찾기" },
  { href: "/visits", label: "사활" },
  { href: "/rankings", label: "랭킹" },
  { href: "/map", label: "지도" },
  { href: "/magazine", label: "매거진" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, pendingCount } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--cream)_88%,transparent)] backdrop-blur-md">
      <div className="page-wrap flex items-center gap-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-[var(--ink)]" aria-label="사우나고싶다 홈">
          <span className="grid size-9 place-items-center rounded-full bg-[var(--ember)] text-white shadow-[0_6px_16px_rgba(194,65,12,0.28)]">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
                d="M7 16c1.2-2.4 1.2-4.4 0-7M12 18c1.5-3 1.5-6 0-9M17 16c1.2-2.4 1.2-4.4 0-7"
              />
            </svg>
          </span>
          <span className="font-serif text-xl tracking-tight">사우나고싶다</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="주요">
          {nav.map((item) => {
            const on = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  on ? "bg-[var(--ink)] text-[var(--cream)]" : "text-[var(--ink-soft)] hover:bg-[var(--cream-2)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto hidden w-full max-w-sm md:block">
          <SearchBox size="md" />
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link href="/submit" className="btn hidden text-[var(--ink-soft)] sm:inline-flex">
            제보
          </Link>
          {user ? (
            <Link href="/me" className="btn-ghost btn hidden sm:inline-flex">
              {user.name}
            </Link>
          ) : (
            <Link href="/signup" className="btn-primary btn hidden sm:inline-flex">
              시작하기
            </Link>
          )}
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--border)] md:hidden"
            aria-expanded={open}
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-[var(--border)] bg-[var(--cream)] px-4 py-3 md:hidden">
          <SearchBox size="md" />
          <div className="mt-3 flex flex-col">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-2 py-3 text-[15px]" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/submit" className="rounded-lg px-2 py-3 text-[15px]" onClick={() => setOpen(false)}>
              시설 제보
            </Link>
            <Link href="/queue" className="rounded-lg px-2 py-3 text-[15px]" onClick={() => setOpen(false)}>
              검수 큐{pendingCount ? ` (${pendingCount})` : ""}
            </Link>
            <Link href={user ? "/me" : "/login"} className="rounded-lg px-2 py-3 text-[15px]" onClick={() => setOpen(false)}>
              {user ? "내 사활" : "로그인"}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
