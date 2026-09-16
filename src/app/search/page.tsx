import { SearchResults } from "@/components/SearchResults";
import { Suspense } from "react";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-[var(--muted)]">검색 준비 중…</div>}>
      <SearchResults />
    </Suspense>
  );
}
