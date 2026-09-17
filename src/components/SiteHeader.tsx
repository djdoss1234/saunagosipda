"use client";

import { SearchBox } from "@/components/SearchBox";
import { useApp } from "@/context/AppState";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/search", label: "찾기" },
  { href: "/visits", label: "방문" },
  { href: "/map", label: "지도" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, pendingCount } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--cream)]">
      <div className="page-wrap flex items-center gap-6 py-4">
        <Link href="/" className="shrink-0 font-serif text-[15px] tracking-wide text-[var(--ink)]" aria-label="사우나고싶다 홈">
          사우나고싶다
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="주요">
          {nav.map((item) => {
            const on = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`text-[13px] tracking-wide transition ${
                  on ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/submit" className="hidden text-[13px] tracking-wide text-[var(--muted)] hover:text-[var(--ink)] sm:inline">
            제보
          </Link>
          {user ? (
            <Link href="/me" className="hidden text-[13px] tracking-wide text-[var(--ink)] sm:inline">
              {user.name}
            </Link>
          ) : (
            <Link href="/signup" className="btn-primary btn hidden sm:inline-flex">
              가입
            </Link>
          )}
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center border border-[var(--border)] md:hidden"
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
              <Link key={item.href} href={item.href} className="px-2 py-3 text-[15px]" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/submit" className="px-2 py-3 text-[15px]" onClick={() => setOpen(false)}>
              시설 제보
            </Link>
            <Link href="/queue" className="px-2 py-3 text-[15px]" onClick={() => setOpen(false)}>
              검수 큐{pendingCount ? ` (${pendingCount})` : ""}
            </Link>
            <Link href={user ? "/me" : "/login"} className="px-2 py-3 text-[15px]" onClick={() => setOpen(false)}>
              {user ? "내 기록" : "로그인"}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
