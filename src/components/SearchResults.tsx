"use client";

import { FacilityCard } from "@/components/FacilityCard";
import { FilterBar } from "@/components/FilterBar";
import { SearchBox } from "@/components/SearchBox";
import { searchFacilities } from "@/lib/search";
import { useSearchParams } from "next/navigation";

export function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const results = searchFacilities({
    q,
    region: params.get("region") ?? undefined,
    type: params.get("type") ?? undefined,
    gender: params.get("gender") ?? undefined,
    amenity: params.get("amenity") ?? undefined,
    open24h: params.get("open24h") === "1",
    outdoor: params.get("outdoor") === "1",
    totonoiPlunge: params.get("totonoiPlunge") === "1",
    sort: (params.get("sort") as "want" | "visit" | "rating" | "price" | "totonoi") ?? "want",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl">사우나 검색</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">이름, 지역, 키워드로 찾고 온도·편의로 좁히세요.</p>
      <div className="mt-6 max-w-xl">
        <SearchBox initial={q} />
      </div>
      <div className="mt-6">
        <FilterBar resultCount={results.length} />
      </div>
      <div className="mt-8 grid gap-4">
        {results.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
            <p className="font-medium">조건에 맞는 시설이 없습니다.</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              지역을 넓히거나, ‘서울’ ‘온천’ ‘24시간’처럼 다른 키워드를 시도해 보세요.
            </p>
          </div>
        ) : (
          results.map((f, i) => <FacilityCard key={f.id} facility={f} rank={i + 1} />)
        )}
      </div>
    </div>
  );
}
