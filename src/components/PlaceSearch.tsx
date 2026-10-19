"use client";

import { areaOf, usePlaceSearch } from "@/components/PlacePicker";
import { MapAuto } from "@/components/MapAuto";
import { viewBounds, type MapView } from "@/components/SaunaMap";
import { useApp } from "@/context/AppState";
import { regions } from "@/data/regions";
import { distanceKm, fmtDistance, type LatLng } from "@/lib/geo";
import type { Place } from "@/lib/types";
import { Bookmark, ChevronRight, LoaderCircle, LocateFixed, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Near = Place & { distanceKm?: number };
const CITY_HALL: MapView = { center: { lat: 37.5663, lng: 126.9779 }, zoom: 12 };
const MARKER_ZOOM = 11;

/** 사우나 찾기 = 부가 기능. 지도 + 내 위치 주변 + 이름 검색. 시설 정보는 인허가에 있는 것만. */
export function PlaceSearch() {
  const { wants, records, feed } = useApp();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const byName = usePlaceSearch(q, 40);

  const [view, setView] = useState<MapView>(CITY_HALL);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [inView, setInView] = useState<Place[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const [me, setMe] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [nearby, setNearby] = useState<Near[] | null>(null);

  const [regionHits, setRegionHits] = useState<{ region: string; places: Place[] }>({ region: "", places: [] });
  const [saved, setSaved] = useState<Place[]>([]);
  const [total, setTotal] = useState(0);

  // 지도 화면 안의 시설: 멈춘 뒤 한 번만(끌 때마다 부르지 않게)
  useEffect(() => {
    if (!size.w || view.zoom < MARKER_ZOOM) return;
    const b = viewBounds(view, size.w, size.h);
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/places?bbox=${[b.south, b.west, b.north, b.east].map((n) => n.toFixed(5)).join(",")}&limit=300`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d: { places: Place[] }) => setInView(d.places))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [view, size]);

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

  function locate() {
    if (!("geolocation" in navigator)) return setLocError("이 브라우저는 위치를 지원하지 않아요.");
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMe(here);
        setView({ center: here, zoom: 14 });
        setSelected(null);
        fetch(`/api/places?near=${here.lat.toFixed(5)},${here.lng.toFixed(5)}&limit=20`, { cache: "no-store" })
          .then((r) => r.json())
          .then((d: { places: Near[]; outside?: boolean }) => {
            setNearby(d.places);
            if (d.outside) setLocError("국내 사우나만 보여 드려요.");
          })
          .catch(() => setLocError("주변 사우나를 불러오지 못했어요."))
          .finally(() => setLocating(false));
      },
      (err) => {
        setLocating(false);
        setLocError(err.code === err.PERMISSION_DENIED ? "위치 권한이 꺼져 있어요. 브라우저 설정에서 허용해 주세요." : "위치를 찾지 못했어요. 잠시 뒤 다시 눌러 주세요.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const markers = useMemo(() => {
    const m = new Map<string, Place>();
    for (const p of [...inView, ...(nearby ?? [])]) if (p.lat !== undefined && p.lng !== undefined) m.set(p.id, p);
    return [...m.values()].map((p) => ({ id: p.id, lat: p.lat!, lng: p.lng!, label: p.name }));
  }, [inView, nearby]);

  const pick = [...inView, ...(nearby ?? [])].find((p) => p.id === selected);
  const distTo = (p: Place) => (me && p.lat !== undefined && p.lng !== undefined ? nearKm(me, p) : undefined);
  const searching = !!q.trim();
  const list = searching ? byName.places.filter((p) => !region || p.regionId === region) : region && regionHits.region === region ? regionHits.places : null;

  return (
    <div className="grid gap-3 pt-3">
      <h1 className="title-xl px-1 pb-1">사우나 찾기</h1>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="sq" className="sr-only">
          이름·동네 검색
        </label>
        <input id="sq" type="search" className="field bg-surface pl-11" placeholder={total ? `전국 ${total.toLocaleString("ko-KR")}곳에서 검색` : "이름, 동네로 검색"} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
      </div>

      {!searching ? (
        <section aria-label="지도" className="relative overflow-hidden rounded-[22px]">
          <MapAuto
            view={view}
            onView={setView}
            onSize={(w, h) => setSize({ w, h })}
            markers={view.zoom >= MARKER_ZOOM ? markers : []}
            selectedId={selected}
            onSelect={setSelected}
            me={me}
            className="h-[min(52vh,420px)]"
          />
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="absolute bottom-3 left-3 z-[6] flex h-10 items-center gap-1.5 rounded-full bg-surface pr-4 pl-3 text-[14px] font-semibold shadow-[0_1px_4px_rgb(0_0_0/0.2)]"
          >
            {locating ? <LoaderCircle className="size-[18px] animate-spin" aria-hidden /> : <LocateFixed className="size-[18px] text-cold" strokeWidth={2.2} aria-hidden />}
            내 주변
          </button>
          {view.zoom < MARKER_ZOOM ? (
            <p className="pointer-events-none absolute top-3 left-1/2 z-[6] -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1.5 text-[13px] text-on-ink">확대하면 사우나가 보여요</p>
          ) : null}
          {pick ? (
            <div className="absolute inset-x-3 bottom-3 z-[7] flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-[0_2px_10px_rgb(0_0_0/0.2)]">
              <Link href={`/saunas/${pick.id}`} className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-bold">{pick.name}</span>
                <span className="block truncate text-[13px] text-muted">
                  {[distTo(pick) !== undefined ? fmtDistance(distTo(pick)!) : null, areaOf(pick), pick.type, counts.get(pick.id) ? `기록 ${counts.get(pick.id)}` : null].filter(Boolean).join(" · ")}
                </span>
              </Link>
              <Link href={`/saunas/${pick.id}`} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill" aria-label="자세히">
                <ChevronRight className="size-5" aria-hidden />
              </Link>
              <button type="button" onClick={() => setSelected(null)} className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-ink text-on-ink" aria-label="닫기">
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
      {locError ? <p className="text-[13px] text-heat">{locError}</p> : null}

      <div className="grid gap-3">
        {!searching && nearby ? (
          <section className="grid gap-2">
            <h2 className="card-title px-1 pt-2">내 주변 사우나</h2>
            {nearby.length ? (
              <PlaceList list={nearby} counts={counts} wants={wants} distance={(p) => (p as Near).distanceKm} onFocus={(p) => focusOn(p)} />
            ) : (
              <p className="card text-center text-[14px] text-muted">50km 안에 등록된 사우나가 없어요.</p>
            )}
          </section>
        ) : null}

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
          <button type="button" className="chip chip-raised" aria-pressed={!region} onClick={() => setRegion("")}>
            전국
          </button>
          {regions.map((r) => (
            <button key={r.id} type="button" className="chip chip-raised" aria-pressed={region === r.id} onClick={() => setRegion(r.id)}>
              {r.name}
            </button>
          ))}
        </div>

        {list ? (
          list.length ? (
            <PlaceList list={list} counts={counts} wants={wants} distance={distTo} />
          ) : byName.loading ? null : (
            <p className="card text-center text-[14px] leading-relaxed text-muted">찾는 곳이 없어요. 목록에 없는 곳은 기록할 때 이름을 직접 적으면 돼요.</p>
          )
        ) : saved.length ? (
          <section className="grid gap-2">
            <h2 className="card-title px-1 pt-2">
              가고싶어요 <span className="num text-[15px] font-medium text-muted">{saved.length}</span>
            </h2>
            <PlaceList list={saved} counts={counts} wants={wants} distance={distTo} />
          </section>
        ) : !nearby ? (
          <p className="pt-2 text-center text-[13px] leading-relaxed text-muted">
            목록은 행정안전부 목욕장업 인허가(영업중) 기준이에요.
            <br />
            온도·요금은 이용자 기록으로만 보여 줘요.
          </p>
        ) : null}
      </div>
    </div>
  );

  function focusOn(p: Place) {
    if (p.lat === undefined || p.lng === undefined) return;
    setView({ center: { lat: p.lat, lng: p.lng }, zoom: Math.max(view.zoom, 15) });
    setSelected(p.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

const nearKm = (a: LatLng, p: Place) => distanceKm(a, { lat: p.lat!, lng: p.lng! });

function PlaceList({
  list,
  counts,
  wants,
  distance,
  onFocus,
}: {
  list: Place[];
  counts: Map<string, number>;
  wants: string[];
  distance?: (p: Place) => number | undefined;
  onFocus?: (p: Place) => void;
}) {
  return (
    <ul className="card py-1">
      {list.map((p) => {
        const d = distance?.(p);
        return (
          <li key={p.id} className="flex items-center border-b border-line last:border-0">
            <Link href={`/saunas/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-semibold">{p.name}</span>
                  {wants.includes(p.id) ? <Bookmark className="size-3.5 shrink-0 fill-current" aria-label="가고싶어요" /> : null}
                </span>
                <span className="text-[13px] text-muted">
                  {[d !== undefined ? fmtDistance(d) : null, areaOf(p), p.type, counts.get(p.id) ? `기록 ${counts.get(p.id)}` : null].filter(Boolean).join(" · ")}
                </span>
              </span>
              {onFocus ? null : <ChevronRight className="size-4 shrink-0 text-muted/50" aria-hidden />}
            </Link>
            {onFocus && p.lat !== undefined ? (
              <button type="button" onClick={() => onFocus(p)} className="ml-2 shrink-0 rounded-full bg-fill px-3 py-1.5 text-[12px] font-medium text-ink-soft">
                지도
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
