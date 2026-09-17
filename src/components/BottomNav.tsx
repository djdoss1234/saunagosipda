"use client";

import { useApp } from "@/context/AppState";
import { Heart, House, Map, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "홈", icon: House, match: (path: string) => path === "/" },
  { href: "/search", label: "찾기", icon: Search, match: (path: string) => path.startsWith("/search") || path.startsWith("/saunas") },
  { href: "/map", label: "지도", icon: Map, match: (path: string) => path.startsWith("/map") },
  { href: "/visits", label: "방문", icon: Heart, match: (path: string) => path.startsWith("/visits") },
  { href: "/me", label: "내 기록", icon: UserRound, match: (path: string) => path.startsWith("/me") || path.startsWith("/login") },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useApp();

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--cream)] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
        {items.map((item) => {
          const href = item.href === "/me" && !user ? "/login?next=/me" : item.href;
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] tracking-wide transition ${
                  active ? "text-[var(--ink)]" : "text-[var(--muted)]"
                }`}
              >
                <Icon className="size-5" aria-hidden strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
