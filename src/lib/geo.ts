import type { Place } from "@/lib/types";

export type LatLng = { lat: number; lng: number };
export type Bounds = { south: number; west: number; north: number; east: number };

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** 두 점 사이 거리(km). */
export function distanceKm(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function fmtDistance(km: number) {
  return km < 1 ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)}m` : `${km < 10 ? km.toFixed(1) : Math.round(km)}km`;
}

export function isKorea(p: LatLng) {
  return p.lat >= 33 && p.lat <= 39 && p.lng >= 124 && p.lng <= 132;
}

type Located = Place & { lat: number; lng: number };
const located = (p: Place): p is Located => typeof p.lat === "number" && typeof p.lng === "number";

/** 가까운 순. 좌표 없는 곳은 뺀다. */
export function nearest(list: Place[], from: LatLng, limit = 20, maxKm = 50) {
  return list
    .filter(located)
    .map((p) => ({ ...p, distanceKm: distanceKm(from, p) }))
    .filter((p) => p.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/** 지도 화면 안에 있는 곳. 많으면 화면 가운데에서 가까운 순으로 자른다. */
export function inBounds(list: Place[], b: Bounds, limit = 300) {
  const c = { lat: (b.south + b.north) / 2, lng: (b.west + b.east) / 2 };
  return list
    .filter(located)
    .filter((p) => p.lat >= b.south && p.lat <= b.north && p.lng >= b.west && p.lng <= b.east)
    .map((p) => ({ p, d: distanceKm(c, p) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, limit)
    .map((x) => x.p);
}

// ---------- 웹 메르카토르 (지도 타일 좌표) ----------

export const TILE = 256;

export function project(ll: LatLng, z: number) {
  const s = TILE * 2 ** z;
  const sin = Math.min(Math.max(Math.sin(rad(ll.lat)), -0.9999), 0.9999);
  return { x: ((ll.lng + 180) / 360) * s, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s };
}

export function unproject(p: { x: number; y: number }, z: number): LatLng {
  const s = TILE * 2 ** z;
  const n = Math.PI - (2 * Math.PI * p.y) / s;
  return { lat: (180 / Math.PI) * Math.atan(Math.sinh(n)), lng: (p.x / s) * 360 - 180 };
}
