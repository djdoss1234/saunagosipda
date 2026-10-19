"use client";

import type { MapMarker, MapView } from "@/components/SaunaMap";
import type { LatLng } from "@/lib/geo";
import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any -- 네이버 지도 SDK는 타입 패키지 없이 쓴다(의존성 추가 금지). */
type Naver = any;

const KEY = process.env.NEXT_PUBLIC_NAVER_MAP_KEY_ID ?? "";
// 신규 콘솔 키는 ncpKeyId, 예전 AI·NAVER API 키는 ncpClientId. 다르면 env로 바꾼다.
const PARAM = process.env.NEXT_PUBLIC_NAVER_MAP_KEY_PARAM || "ncpKeyId";
export const naverMapEnabled = !!KEY;

let loading: Promise<Naver> | null = null;
let authFailed = false;
const failListeners = new Set<() => void>();

/** maps.js를 한 번만 불러온다. 인증 실패는 navermap_authFailure 전역 콜백으로 온다. */
function loadNaver(): Promise<Naver> {
  const w = window as any;
  if (w.naver?.maps) return Promise.resolve(w.naver);
  if (loading) return loading;
  w.navermap_authFailure = () => {
    authFailed = true;
    failListeners.forEach((f) => f());
  };
  loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${PARAM}=${encodeURIComponent(KEY)}`;
    s.async = true;
    s.onload = () => (w.naver?.maps ? resolve(w.naver) : reject(new Error("naver maps missing")));
    s.onerror = () => reject(new Error("naver maps load failed"));
    document.head.appendChild(s);
  });
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

const dot = (on: boolean) =>
  `<span style="display:block;box-sizing:border-box;width:${on ? 18 : 12}px;height:${on ? 18 : 12}px;border-radius:999px;border:2px solid #fff;background:${on ? "#1d1c1f" : "#ee5a24"};box-shadow:0 1px 3px rgba(0,0,0,.35)"></span>`;
const meDot =
  '<span style="position:relative;display:block;width:14px;height:14px"><span style="position:absolute;inset:-10px;border-radius:999px;background:rgba(43,125,233,.2)"></span><span style="position:relative;display:block;box-sizing:border-box;width:14px;height:14px;border-radius:999px;border:2.5px solid #fff;background:#2b7de9;box-shadow:0 1px 3px rgba(0,0,0,.35)"></span></span>';

const near = (a: number, b: number, eps: number) => Math.abs(a - b) < eps;

/**
 * 네이버 지도(Web Dynamic Map). SaunaMap과 같은 props라 갈아 끼울 수 있다.
 * 키가 없거나 인증·로드에 실패하면 onFail → 부모가 OSM 지도로 바꾼다.
 */
export function NaverMap({
  view,
  onView,
  markers,
  selectedId,
  onSelect,
  me,
  interactive = true,
  className = "",
  onSize,
  onFail,
}: {
  view: MapView;
  onView?: (v: MapView) => void;
  markers: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  me?: LatLng | null;
  interactive?: boolean;
  className?: string;
  onSize?: (w: number, h: number) => void;
  onFail?: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Naver>(null);
  const nRef = useRef<Naver>(null);
  const markerRefs = useRef(new Map<string, Naver>());
  const meRef = useRef<Naver>(null);
  const cb = useRef({ onView, onSelect, onSize, onFail });
  const initView = useRef(view);
  const initInteractive = useRef(interactive);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    cb.current = { onView, onSelect, onSize, onFail };
  });

  // 지도 만들기(한 번)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let alive = true;
    const fail = () => alive && cb.current.onFail?.();
    if (authFailed) {
      fail();
      return;
    }
    failListeners.add(fail);
    let ro: ResizeObserver | null = null;
    const listeners: Naver[] = [];
    const placed = markerRefs.current;
    loadNaver()
      .then((naver) => {
        if (!alive) return;
        nRef.current = naver;
        const v = initView.current;
        const i = initInteractive.current;
        const map = new naver.maps.Map(el, {
          center: new naver.maps.LatLng(v.center.lat, v.center.lng),
          zoom: v.zoom,
          minZoom: 6,
          maxZoom: 19,
          zoomControl: i,
          zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT, style: naver.maps.ZoomControlStyle.SMALL },
          scaleControl: false,
          logoControlOptions: { position: naver.maps.Position.BOTTOM_RIGHT },
          mapDataControl: false,
          draggable: i,
          pinchZoom: i,
          scrollWheel: i,
          keyboardShortcuts: i,
          disableDoubleClickZoom: !i,
          disableDoubleTapZoom: !i,
          disableTwoFingerTapZoom: !i,
        });
        mapRef.current = map;
        listeners.push(
          naver.maps.Event.addListener(map, "idle", () => {
            const c = map.getCenter();
            cb.current.onView?.({ center: { lat: c.lat(), lng: c.lng() }, zoom: map.getZoom() });
          }),
          naver.maps.Event.addListener(map, "click", () => cb.current.onSelect?.(null)),
        );
        ro = new ResizeObserver(([e]) => {
          const w = Math.round(e.contentRect.width);
          const h = Math.round(e.contentRect.height);
          map.setSize(new naver.maps.Size(w, h));
          cb.current.onSize?.(w, h);
        });
        ro.observe(el);
        setReady(true);
      })
      .catch(fail);
    return () => {
      alive = false;
      failListeners.delete(fail);
      ro?.disconnect();
      const naver = nRef.current;
      if (naver) listeners.forEach((l) => naver.maps.Event.removeListener(l));
      placed.forEach((m) => m.setMap(null));
      placed.clear();
      meRef.current?.setMap(null);
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
  }, []);

  // 부모가 view를 바꾸면(내 위치·목록에서 '지도') 따라간다. 지도 스스로 움직인 건 idle로 이미 같다.
  useEffect(() => {
    const map = mapRef.current;
    const naver = nRef.current;
    if (!map || !naver) return;
    const c = map.getCenter();
    if (near(c.lat(), view.center.lat, 1e-5) && near(c.lng(), view.center.lng, 1e-5) && map.getZoom() === view.zoom) return;
    map.morph(new naver.maps.LatLng(view.center.lat, view.center.lng), view.zoom, { duration: 250 });
  }, [view, ready]);

  // 마커: id로 비교해 늘고 준 것만 반영
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const naver = nRef.current;
    if (!map || !naver) return;
    const cur = markerRefs.current;
    const next = new Set(markers.map((m) => m.id));
    for (const [id, mk] of cur) {
      if (!next.has(id)) {
        mk.setMap(null);
        cur.delete(id);
      }
    }
    for (const m of markers) {
      const on = m.id === selectedId;
      const existing = cur.get(m.id);
      if (existing) {
        existing.setIcon({ content: dot(on), anchor: new naver.maps.Point(on ? 9 : 6, on ? 9 : 6) });
        existing.setZIndex(on ? 3 : 1);
        continue;
      }
      const mk = new naver.maps.Marker({
        map,
        position: new naver.maps.LatLng(m.lat, m.lng),
        title: m.label,
        clickable: true,
        zIndex: on ? 3 : 1,
        icon: { content: dot(on), anchor: new naver.maps.Point(on ? 9 : 6, on ? 9 : 6) },
      });
      naver.maps.Event.addListener(mk, "click", () => cb.current.onSelect?.(m.id));
      cur.set(m.id, mk);
    }
  });

  // 내 위치
  useEffect(() => {
    const map = mapRef.current;
    const naver = nRef.current;
    if (!map || !naver) return;
    if (!me) {
      meRef.current?.setMap(null);
      meRef.current = null;
      return;
    }
    const pos = new naver.maps.LatLng(me.lat, me.lng);
    if (meRef.current) meRef.current.setPosition(pos);
    else meRef.current = new naver.maps.Marker({ map, position: pos, clickable: false, zIndex: 4, icon: { content: meDot, anchor: new naver.maps.Point(7, 7) } });
  }, [me, ready]);

  return <div ref={box} className={`relative overflow-hidden bg-fill ${className}`} />;
}
