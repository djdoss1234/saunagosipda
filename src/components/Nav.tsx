"use client";

import { MessageSquare, PencilLine, Search, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "기록", icon: PencilLine },
  { href: "/feed", label: "피드", icon: MessageSquare },
  { href: "/saunas", label: "사우나", icon: Search },
  { href: "/me", label: "마이", icon: User },
];

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "/new";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 위: 이름 한 줄. 아래(모바일): 탭 4개. 첫 탭이 곧 기록 화면이다. */
export function Nav() {
  const pathname = usePathname();
  if (pathname === "/live") return null; // 타이머는 화면 전체를 쓴다

  return (
    <>
      <header className="sticky top-0 z-30 bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-13 max-w-lg items-center px-4">
          <Link href="/" className="text-[19px] font-extrabold tracking-[-0.04em]">
            사우나고싶다
          </Link>
          <nav className="ml-auto hidden gap-1 md:flex" aria-label="주 메뉴">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active(pathname, t.href) ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[14px] ${active(pathname, t.href) ? "bg-ink font-semibold text-on-ink" : "text-ink-soft hover:bg-fill"}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <nav aria-label="하단 메뉴" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {tabs.map(({ href, label, icon: Icon }) => {
            const on = active(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={`flex h-[58px] flex-col items-center justify-center gap-1 text-[11px] ${on ? "font-semibold text-ink" : "text-muted"}`}
                >
                  <Icon className="size-[22px]" strokeWidth={on ? 2.2 : 1.7} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
