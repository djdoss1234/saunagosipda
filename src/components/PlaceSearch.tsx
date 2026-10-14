"use client";

import { areaOf, usePlaceSearch } from "@/components/PlacePicker";
import { useApp } from "@/context/AppState";
import { regions } from "@/data/regions";
import type { Place } from "@/lib/types";
import { Bookmark, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/** 사우나 찾기 = 부가 기능. 이름·동네로 찾고, 기록 수만 붙인다. */
export function PlaceSearch() {
  const params = useSearchParams();
  const router = useRouter();
  const { wants, records, feed } = useApp();
  const [q, setQ] = useState(params.get("q") ?? "");
  const region = params.get("region") ?? "";
  const byName = usePlaceSearch(q, 40);
  const [regionHits, setRegionHits] = useState<{ region: string; places: Place[] }>({ region: "", places: [] });
  const [saved, setSaved] = useState<Place[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!region || q.trim()) return;
    fetch(`/api/places?region=${region}&limit=60`)
      .then((r) => r.json())
      .then((b: { places: Place[] }) => setRegionHits({ region, places: b.places }))
      .catch(() => {});
  }, [region, q]);

  const wantKey = wants.join(",");
  useEffect(() => {
    fetch(`/api/places${wantKey ? `?ids=${wantKey}` : "?limit=1"}`)
      .then((r) => r.json())
      .then((b: { places: Place[]; total: number }) => {
        setTotal(b.total);
        if (wantKey) setSaved(b.places);
      })
      .catch(() => {});
  }, [wantKey]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    const seen = new Set<string>();
    for (const r of [...records, ...feed]) {
      if (!r.placeId || seen.has(r.id)) continue;
      seen.add(r.id);
      m.set(r.placeId, (m.get(r.placeId) ?? 0) + 1);
    }
    return m;
  }, [records, feed]);

  const setRegion = (next: string) => router.replace(`/saunas${next ? `?region=${next}` : ""}`, { scroll: false });
  const list = q.trim() ? byName.places.filter((p) => !region || p.regionId === region) : region && regionHits.region === region ? regionHits.places : null;

  return (
    <div className="grid gap-4 pt-2">
      <h1 className="text-[24px] font-bold">사우나 찾기</h1>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="sq" className="sr-only">
          이름·동네 검색
        </label>
        <input id="sq" type="search" className="field pl-11" placeholder={total ? `전국 ${total.toLocaleString("ko-KR")}곳에서 검색` : "이름, 동네로 검색"} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
      </div>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
        <button type="button" className="chip" aria-pressed={!region} onClick={() => setRegion("")}>
          전국
        </button>
        {regions.map((r) => (
          <button key={r.id} type="button" className="chip" aria-pressed={region === r.id} onClick={() => setRegion(r.id)}>
            {r.name}
          </button>
        ))}
      </div>

      {list ? (
        list.length ? (
          <PlaceList list={list} counts={counts} wants={wants} />
        ) : byName.loading ? null : (
          <p className="py-10 text-center text-[14px] text-muted">찾는 곳이 없어요. 목록에 없는 곳은 기록할 때 이름을 직접 적으면 돼요.</p>
        )
      ) : saved.length ? (
        <section className="grid gap-1">
          <h2 className="section-title mt-2">
            가고싶어요 <span className="num text-[15px] font-medium text-muted">{saved.length}</span>
          </h2>
          <PlaceList list={saved} counts={counts} wants={wants} />
        </section>
      ) : (
        <p className="pt-6 text-center text-[13px] leading-relaxed text-muted">
          목록은 행정안전부 목욕장업 인허가(영업중) 기준이에요.
          <br />
          온도·요금은 이용자 기록으로만 보여 줘요.
        </p>
      )}
    </div>
  );
}

function PlaceList({ list, counts, wants }: { list: Place[]; counts: Map<string, number>; wants: string[] }) {
  return (
    <ul>
      {list.map((p) => (
        <li key={p.id} className="border-b border-line last:border-0">
          <Link href={`/saunas/${p.id}`} className="flex items-center gap-3 py-3.5">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-semibold">{p.name}</span>
                {wants.includes(p.id) ? <Bookmark className="size-3.5 shrink-0 fill-current" aria-label="가고싶어요" /> : null}
              </span>
              <span className="text-[13px] text-muted">
                {areaOf(p)} · {p.type}
                {counts.get(p.id) ? ` · 기록 ${counts.get(p.id)}` : ""}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-fill-2" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
