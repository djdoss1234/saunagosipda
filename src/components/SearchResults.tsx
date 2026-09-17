"use client";

import { CatalogStatus } from "@/components/CatalogStatus";
import { FacilityCard } from "@/components/FacilityCard";
import { FilterBar } from "@/components/FilterBar";
import { SearchBox } from "@/components/SearchBox";
import { useApp } from "@/context/AppState";
import { searchFacilities } from "@/lib/search";
import type { Facility } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function PagedCards({ results }: { results: Facility[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 40;
  const visible = results.slice(0, page * pageSize);
  return (
    <>
      {visible.map((f) => (
        <FacilityCard key={f.id} facility={f} />
      ))}
      {visible.length < results.length ? (
        <button type="button" className="btn-ghost btn w-full" onClick={() => setPage((p) => p + 1)}>
          더 보기 ({visible.length}/{results.length})
        </button>
      ) : null}
    </>
  );
}

export function SearchResults() {
  const params = useSearchParams();
  const { catalog } = useApp();
  const q = params.get("q") ?? "";
  const results = searchFacilities(
    {
      q,
      region: params.get("region") ?? undefined,
      type: params.get("type") ?? undefined,
      gender: params.get("gender") ?? undefined,
      amenity: params.get("amenity") ?? undefined,
      open24h: params.get("open24h") === "1",
      outdoor: params.get("outdoor") === "1",
      totonoiPlunge: params.get("totonoiPlunge") === "1",
      sort: (params.get("sort") as "want" | "visit" | "rating" | "price" | "totonoi" | "name") ?? "name",
    },
    catalog,
  );

  return (
    <div className="page-wrap py-10">
      <p className="kicker">Search</p>
      <h1 className="mt-2 font-serif text-3xl">사우나 검색</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">이름·지역은 인허가, 온도 필터는 방문 기록이 있는 곳만 걸립니다.</p>
      <div className="mt-6 max-w-xl">
        <SearchBox initial={q} />
      </div>
      <div className="mt-6">
        <FilterBar resultCount={results.length} />
      </div>
      <div className="mt-6">
        <CatalogStatus />
      </div>
      <div className="mt-8 grid gap-4">
            {results.length === 0 ? (
          <div className="panel p-8">
            <p className="font-medium">이 조건으로는 안 보입니다.</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              입장·편의·외기욕은 대표 시드에만 있습니다. 지역만 남기거나{" "}
              <Link href="/search" className="text-[var(--ember-deep)]">
                필터를 지우고
              </Link>{" "}
              다시 보거나,{" "}
              <Link href="/submit" className="text-[var(--ember-deep)]">
                제보
              </Link>
              해 주세요. 목록은 인허가 영업중 기준입니다.{" "}
              <Link href="/about" className="text-[var(--ember-deep)]">
                데이터와 한계
              </Link>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/search?region=seoul" className="chip min-h-10 py-0 text-xs">
                서울
              </Link>
              <Link href="/search?region=gwangju" className="chip min-h-10 py-0 text-xs">
                광주
              </Link>
              <Link href="/search?region=jeonnam" className="chip min-h-10 py-0 text-xs">
                전남
              </Link>
              <Link href="/search?region=incheon" className="chip min-h-10 py-0 text-xs">
                인천
              </Link>
            </div>
          </div>
        ) : (
          <PagedCards key={params.toString()} results={results} />
        )}
      </div>
    </div>
  );
}
