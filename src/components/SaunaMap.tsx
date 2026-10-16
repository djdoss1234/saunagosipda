"use client";

import { project, TILE, unproject, type Bounds, type LatLng } from "@/lib/geo";
import { Minus, Plus } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type MapMarker = { id: string; lat: number; lng: number; label: string };
export type MapView = { center: LatLng; zoom: number };

const MIN_Z = 6;
const MAX_Z = 18;
const clampZ = (z: number) => Math.max(MIN_Z, Math.min(MAX_Z, z));
// ponytail: OSM 공개 타일. 트래픽이 커지면 OSM 정책상 자체 타일·상용(카카오/네이버 등)으로 바꿔야 한다.
const tileUrl = (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

export function viewBounds(view: MapView, w: number, h: number): Bounds {
  const c = project(view.center, view.zoom);
  const nw = unproject({ x: c.x - w / 2, y: c.y - h / 2 }, view.zoom);
  const se = unproject({ x: c.x + w / 2, y: c.y + h / 2 }, view.zoom);
  return { south: se.lat, west: nw.lng, north: nw.lat, east: se.lng };
}

/**
 * 지도 라이브러리 없이 만든 작은 타일 지도. 끌어서 이동, 휠·더블탭·두 손가락·버튼으로 확대.
 * 상태는 부모가 가진다(view/onView). 마커는 점 하나, 고르면 커진다.
 */
export function SaunaMap({
  view,
  onView,
  markers,
  selectedId,
  onSelect,
  me,
  interactive = true,
  className = "",
  onSize,
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
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ moved: boolean; pinch0?: number } | null>(null);
  const viewRef = useRef(view);
  const onSizeRef = useRef(onSize);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      setSize({ w, h });
      onSizeRef.current?.(w, h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const z = view.zoom;
  const c = project(view.center, z);
  const left = c.x - w / 2;
  const top = c.y - h / 2;
  const n = 2 ** z;

  const tiles: { key: string; x: number; y: number; src: string }[] = [];
  if (w && h) {
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + w) / TILE); tx += 1) {
      for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + h) / TILE); ty += 1) {
        if (ty < 0 || ty >= n) continue;
        const wx = ((tx % n) + n) % n;
        tiles.push({ key: `${z}/${tx}/${ty}`, x: tx * TILE - left, y: ty * TILE - top, src: tileUrl(z, wx, ty) });
      }
    }
  }

  const toScreen = (ll: LatLng) => {
    const p = project(ll, z);
    return { x: p.x - left, y: p.y - top };
  };

  const move = (dx: number, dy: number) => {
    const v = viewRef.current;
    const p = project(v.center, v.zoom);
    onView?.({ center: unproject({ x: p.x - dx, y: p.y - dy }, v.zoom), zoom: v.zoom });
  };

  /** 화면의 한 점(ox, oy)을 그대로 둔 채 확대/축소 */
  const zoomAt = (dz: number, ox = w / 2, oy = h / 2) => {
    const v = viewRef.current;
    const nz = clampZ(v.zoom + dz);
    if (nz === v.zoom) return;
    const p = project(v.center, v.zoom);
    const point = { x: p.x - w / 2 + ox, y: p.y - h / 2 + oy };
    const k = 2 ** (nz - v.zoom);
    const np = { x: point.x * k - ox + w / 2, y: point.y * k - oy + h / 2 };
    onView?.({ center: unproject(np, nz), zoom: nz });
  };

  const handlers = interactive
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          if ((e.target as HTMLElement).closest("button")) return;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          drag.current = { moved: false };
        },
        onPointerMove: (e: React.PointerEvent) => {
          const prev = pointers.current.get(e.pointerId);
          if (!prev || !drag.current) return;
          const cur = { x: e.clientX, y: e.clientY };
          pointers.current.set(e.pointerId, cur);
          if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            drag.current.pinch0 ??= d;
            const ratio = d / drag.current.pinch0;
            if (ratio > 1.5 || ratio < 0.67) {
              const rect = box.current!.getBoundingClientRect();
              zoomAt(ratio > 1 ? 1 : -1, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
              drag.current.pinch0 = d;
            }
            drag.current.moved = true;
            return;
          }
          const dx = cur.x - prev.x;
          const dy = cur.y - prev.y;
          if (Math.abs(dx) + Math.abs(dy) > 0) {
            drag.current.moved = true;
            move(dx, dy);
          }
        },
        onPointerUp: (e: React.PointerEvent) => {
          pointers.current.delete(e.pointerId);
          if (pointers.current.size < 2 && drag.current) drag.current.pinch0 = undefined;
          if (!pointers.current.size) {
            if (drag.current && !drag.current.moved && !(e.target as HTMLElement).closest("[data-marker]")) onSelect?.(null);
            drag.current = null;
          }
        },
        onPointerCancel: (e: React.PointerEvent) => {
          pointers.current.delete(e.pointerId);
          drag.current = null;
        },
        onDoubleClick: (e: React.MouseEvent) => {
          const rect = box.current!.getBoundingClientRect();
          zoomAt(1, e.clientX - rect.left, e.clientY - rect.top);
        },
      }
    : {};

  // 이벤트 핸들러가 최신 값을 보게 렌더 뒤에 맞춘다(렌더 중 ref 쓰기 금지 규칙).
  const zoomAtRef = useRef(zoomAt);
  useLayoutEffect(() => {
    viewRef.current = view;
    onSizeRef.current = onSize;
    zoomAtRef.current = zoomAt;
  });

  // 휠 확대: passive 리스너로는 preventDefault가 안 돼서 직접 붙인다. 연속 휠은 한 단계씩.
  useEffect(() => {
    const el = box.current;
    if (!el || !interactive) return;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - last < 250 || Math.abs(e.deltaY) < 4) return;
      last = now;
      const rect = el.getBoundingClientRect();
      zoomAtRef.current(e.deltaY < 0 ? 1 : -1, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [interactive]);

  const meAt = me ? toScreen(me) : null;

  return (
    <div
      ref={box}
      className={`relative touch-none overflow-hidden bg-fill select-none ${interactive ? "cursor-grab active:cursor-grabbing" : ""} ${className}`}
      {...handlers}
    >
      {tiles.map((t) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={t.key} src={t.src} alt="" draggable={false} width={TILE} height={TILE} className="map-tile pointer-events-none absolute max-w-none" style={{ left: t.x, top: t.y }} />
      ))}

      {markers.map((m) => {
        const p = toScreen(m);
        if (p.x < -20 || p.y < -20 || p.x > w + 20 || p.y > h + 20) return null;
        const on = m.id === selectedId;
        return (
          <button
            key={m.id}
            type="button"
            data-marker
            aria-label={m.label}
            aria-pressed={on}
            tabIndex={interactive ? 0 : -1}
            onClick={() => onSelect?.(m.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 p-1.5"
            style={{ left: p.x, top: p.y, zIndex: on ? 3 : 1 }}
          >
            <span className={`block rounded-full border-2 border-white shadow-[0_1px_3px_rgb(0_0_0/0.35)] ${on ? "size-[18px] bg-ink" : "size-3 bg-heat"}`} />
          </button>
        );
      })}

      {meAt ? (
        <span className="pointer-events-none absolute z-[4] -translate-x-1/2 -translate-y-1/2" style={{ left: meAt.x, top: meAt.y }} aria-label="내 위치">
          <span className="absolute inset-[-10px] rounded-full bg-cold/20" />
          <span className="relative block size-3.5 rounded-full border-[2.5px] border-white bg-cold shadow-[0_1px_3px_rgb(0_0_0/0.35)]" />
        </span>
      ) : null}

      {interactive ? (
        <div className="absolute top-2.5 right-2.5 z-[5] grid overflow-hidden rounded-xl bg-surface shadow-[0_1px_4px_rgb(0_0_0/0.18)]">
          <button type="button" aria-label="확대" onClick={() => zoomAt(1)} disabled={z >= MAX_Z} className="flex size-9 items-center justify-center border-b border-line disabled:opacity-30">
            <Plus className="size-4" aria-hidden />
          </button>
          <button type="button" aria-label="축소" onClick={() => zoomAt(-1)} disabled={z <= MIN_Z} className="flex size-9 items-center justify-center disabled:opacity-30">
            <Minus className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute right-1 bottom-1 z-[5] rounded bg-surface/80 px-1 text-[10px] text-muted"
      >
        © OpenStreetMap
      </a>
    </div>
  );
}
