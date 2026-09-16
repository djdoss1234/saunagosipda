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
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 font-serif text-xl tracking-tight text-[var(--ink)]">
          사우나고싶다
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 text-sm transition ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-[var(--ink)] text-[var(--cream)]"
                  : "text-[var(--ink-soft)] hover:bg-[var(--cream-2)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden w-full max-w-sm md:block">
          <SearchBox size="md" />
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/submit"
            className="hidden min-h-11 items-center px-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-flex"
          >
            제보
          </Link>
          <Link
            href="/queue"
            className="relative hidden min-h-11 items-center px-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-flex"
          >
            검수
            {pendingCount > 0 ? (
              <span className="ml-1 rounded-full bg-[var(--ember)] px-1.5 text-[10px] font-semibold text-white">
                {pendingCount}
              </span>
            ) : null}
          </Link>
          {user ? (
            <Link
              href="/me"
              className="hidden min-h-11 items-center rounded-full border border-[var(--border)] px-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--cream-2)] sm:inline-flex"
            >
              {user.name}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden min-h-11 items-center px-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-flex"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="hidden min-h-11 items-center rounded-full bg-[var(--ember)] px-3 text-sm font-semibold text-white hover:bg-[var(--ember-deep)] sm:inline-flex"
              >
                회원가입
              </Link>
            </>
          )}
          <button
            type="button"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] md:hidden"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--cream)] px-4 py-3 md:hidden">
          <SearchBox size="md" />
          <div className="mt-3 flex flex-col">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2 py-3 text-[15px]"
                onClick={() => setOpen(false)}
              >
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
      )}
    </header>
  );
}
