"use client";

import { regions } from "@/data/regions";
import type { Place } from "@/lib/types";
import { MapPin, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

export type PickedPlace = { placeId?: string; placeName: string; area?: string };

const regionName = new Map(regions.map((r) => [r.id, r.name]));
export const areaOf = (p: Pick<Place, "regionId" | "district">) => `${regionName.get(p.regionId) ?? ""} ${p.district}`.trim();

/** 시설 검색은 서버(/api/places)에서 한다. 전국 목록을 폰에 내려보내지 않는다. */
export function usePlaceSearch(q: string, limit = 6) {
  const [res, setRes] = useState<{ q: string; places: Place[] }>({ q: "", places: [] });
  const query = q.trim();
  useEffect(() => {
    if (!query) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/places?q=${encodeURIComponent(query)}&limit=${limit}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : { places: [] }))
        .then((b: { places?: Place[] }) => setRes({ q: query, places: b.places ?? [] }))
        .catch(() => {});
    }, 120);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query, limit]);
  return { places: query && res.q === query ? res.places : [], loading: !!query && res.q !== query };
}

/** 최근 간 곳은 칩 한 번. 아니면 검색. 목록에 없으면 적은 이름 그대로. */
export function PlacePicker({ value, recent, onChange }: { value: PickedPlace | null; recent: PickedPlace[]; onChange: (p: PickedPlace | null) => void }) {
  const [q, setQ] = useState("");
  const { places, loading } = usePlaceSearch(q);

  if (value) {
    return (
      <div className="flex min-h-[3.25rem] items-center gap-3 rounded-xl bg-fill pr-1.5 pl-4">
        <MapPin className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold">{value.placeName}</span>
          {value.area ? <span className="block truncate text-[12px] text-muted">{value.area}</span> : null}
        </span>
        <button type="button" onClick={() => onChange(null)} className="flex size-10 items-center justify-center rounded-full text-muted hover:text-ink" aria-label="장소 바꾸기">
          <X className="size-[18px]" aria-hidden />
        </button>
      </div>
    );
  }

  const pick = (p: PickedPlace) => {
    onChange(p);
    setQ("");
  };

  return (
    <div className="grid gap-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="place-q" className="sr-only">
          사우나 이름
        </label>
        <input
          id="place-q"
          className="field pl-11"
          placeholder="사우나 이름으로 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      {q.trim() ? (
        <ul className="overflow-hidden rounded-xl border border-line" aria-busy={loading}>
          {places.map((p) => (
            <li key={p.id} className="border-b border-line last:border-0">
              <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-fill" onClick={() => pick({ placeId: p.id, placeName: p.name, area: areaOf(p) })}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{p.name}</span>
                  <span className="block truncate text-[12px] text-muted">{p.address}</span>
                </span>
              </button>
            </li>
          ))}
          {loading && !places.length ? <li className="px-4 py-3 text-[14px] text-muted">찾는 중</li> : null}
          <li>
            <button type="button" className="w-full px-4 py-3 text-left text-[14px] text-ink-soft hover:bg-fill" onClick={() => pick({ placeName: q.trim() })}>
              목록에 없어요 · <span className="font-semibold text-ink">&lsquo;{q.trim()}&rsquo;</span>로 남기기
            </button>
          </li>
        </ul>
      ) : recent.length ? (
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
          {recent.map((p) => (
            <button key={p.placeId ?? p.placeName} type="button" className="chip" onClick={() => pick(p)}>
              {p.placeName}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
