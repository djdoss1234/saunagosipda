import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] py-10 text-sm text-[var(--muted)]">
      <div className="page-wrap flex flex-wrap items-center justify-between gap-4">
        <p>사우나고싶다</p>
        <nav className="flex flex-wrap gap-6">
          <Link href="/about" className="hover:text-[var(--ink)]">
            데이터
          </Link>
          <Link href="/search" className="hover:text-[var(--ink)]">
            검색
          </Link>
          <Link href="/map" className="hover:text-[var(--ink)]">
            지도
          </Link>
        </nav>
      </div>
    </footer>
  );
}
