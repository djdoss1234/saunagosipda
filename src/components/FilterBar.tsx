"use client";

import { regionGroups, regions } from "@/data/regions";
import { useRouter, useSearchParams } from "next/navigation";

const types = ["찜질방", "온천", "호텔스파", "사우나", "워터파크스파"];
const genders = ["남녀분리", "혼성", "남성전용", "여성전용"];
const amenities = ["24시간", "수면실", "노천탕", "외기욕", "온천수", "예약제", "주차"];
const sorts = [
  { id: "want", label: "가고싶어요순" },
  { id: "visit", label: "사활순" },
  { id: "rating", label: "평점순" },
  { id: "price", label: "낮은 요금순" },
  { id: "totonoi", label: "토토노이 적합순" },
];

export function FilterBar({ resultCount }: { resultCount: number }) {
  const params = useSearchParams();
  const router = useRouter();

  function set(key: string, value?: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/search?${next.toString()}`);
  }

  const selectClass =
    "min-h-11 cursor-pointer rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className={selectClass} value={params.get("region") ?? ""} onChange={(e) => set("region", e.target.value || undefined)} aria-label="지역">
          <option value="">모든 지역</option>
          {regionGroups.map((g) => (
            <optgroup key={g} label={g}>
              {regions
                .filter((r) => r.group === g)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <select className={selectClass} value={params.get("type") ?? ""} onChange={(e) => set("type", e.target.value || undefined)} aria-label="시설 유형">
          <option value="">모든 유형</option>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className={selectClass} value={params.get("gender") ?? ""} onChange={(e) => set("gender", e.target.value || undefined)} aria-label="입장">
          <option value="">입장 제한 없음</option>
          {genders.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className={selectClass} value={params.get("amenity") ?? ""} onChange={(e) => set("amenity", e.target.value || undefined)} aria-label="편의">
          <option value="">편의시설</option>
          {amenities.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--ember)]"
            checked={params.get("open24h") === "1"}
            onChange={(e) => set("open24h", e.target.checked ? "1" : undefined)}
          />
          지금 24시간
        </label>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--ember)]"
            checked={params.get("outdoor") === "1"}
            onChange={(e) => set("outdoor", e.target.checked ? "1" : undefined)}
          />
          외기욕 있음
        </label>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--ember)]"
            checked={params.get("totonoiPlunge") === "1"}
            onChange={(e) => set("totonoiPlunge", e.target.checked ? "1" : undefined)}
          />
          냉탕 16–18°C
        </label>
        <select className={selectClass} value={params.get("sort") ?? "want"} onChange={(e) => set("sort", e.target.value)} aria-label="정렬">
          {sorts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-[var(--muted)]">{resultCount}개 시설 · 입장·편의·외기욕은 시드/사활이 있는 곳만</p>
    </div>
  );
}
