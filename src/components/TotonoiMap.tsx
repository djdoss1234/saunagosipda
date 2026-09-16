"use client";

import { FacilityCard } from "@/components/FacilityCard";
import { useApp } from "@/context/AppState";
import { projectKorea, scoreColor } from "@/harness/community";
import { totonoiScore } from "@/lib/totonoi";
import type { Facility } from "@/lib/types";
import { useMemo, useState } from "react";

type Filter = "all" | "hot" | "outdoor";

export function TotonoiMap() {
  const { catalog } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Facility | null>(null);

  const pins = useMemo(() => {
    return catalog.filter((f) => {
      const score = totonoiScore(f);
      if (filter === "hot") return score >= 70;
      if (filter === "outdoor") {
        const rest = f.totonoi?.outdoorRest;
        return rest === "있음" || rest === "우수";
      }
      return true;
    });
  }, [catalog, filter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "전체"],
            ["hot", "적합 70+"],
            ["outdoor", "외기욕"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`min-h-11 rounded-full px-4 text-sm ${
              filter === id ? "bg-[var(--ink)] text-[var(--cream)]" : "border border-[var(--border)] bg-[var(--surface)]"
            }`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative mt-6 aspect-[3/4] overflow-hidden rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,#d7e4da,#efe6d8)] sm:aspect-[4/3]">
        <p className="pointer-events-none absolute left-4 top-4 text-xs text-[var(--ink-soft)]">한반도 · 토토노이 점수</p>
        {pins.map((f) => {
          const { x, y } = projectKorea(f.lat, f.lng);
          const score = totonoiScore(f);
          return (
            <button
              key={f.id}
              type="button"
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-white text-[10px] font-semibold text-white shadow"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                background: scoreColor(score),
                minWidth: 28,
                minHeight: 28,
              }}
              aria-label={`${f.name} 토토노이 ${score}`}
              onClick={() => setSelected(f)}
            >
              {score}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--muted)]">
        <span>낮음</span>
        <span className="h-2 w-20 rounded-full bg-[linear-gradient(90deg,#7A6E63,#9A3412)]" />
        <span>높음</span>
        <span className="ml-auto">{pins.length}곳</span>
      </div>

      {selected ? (
        <div className="mt-6">
          <FacilityCard facility={selected} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--muted)]">점을 누르면 시설이 열립니다.</p>
      )}
    </div>
  );
}
