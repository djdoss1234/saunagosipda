import { SearchResults } from "@/components/SearchResults";
import { Suspense } from "react";

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="page-wrap py-16 text-center text-sm text-[var(--muted)]">검색 준비 중…</p>}>
      <SearchResults />
    </Suspense>
  );
}
