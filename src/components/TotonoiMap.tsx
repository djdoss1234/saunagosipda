"use client";

import { FacilityCard } from "@/components/FacilityCard";
import { useApp } from "@/context/AppState";
import { hasKoreaCoords, isLicensedId } from "@/data/places";
import { projectKorea, scoreColor } from "@/harness/community";
import { totonoiScore } from "@/lib/totonoi";
import type { Facility } from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

type Filter = "all" | "hot" | "outdoor";

export function TotonoiMap() {
  const { catalog } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Facility | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const pins = useMemo(() => {
    return catalog.filter((f) => {
      if (!hasKoreaCoords(f.lat, f.lng)) return false;
      const score = totonoiScore(f);
      if (filter === "hot") return score >= 70;
      if (filter === "outdoor") {
        const rest = f.totonoi?.outdoorRest;
        return rest === "있음" || rest === "우수";
      }
      return true;
    });
  }, [catalog, filter]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (const f of pins) {
        const { x, y } = projectKorea(f.lat, f.lng);
        const score = totonoiScore(f);
        const unknown = isLicensedId(f.id) && score === 0;
        ctx.beginPath();
        ctx.fillStyle = unknown ? "rgba(92, 83, 76, 0.55)" : scoreColor(score);
        ctx.arc((x / 100) * rect.width, (y / 100) * rect.height, unknown ? 2.2 : 7, 0, Math.PI * 2);
        ctx.fill();
        if (!unknown) {
          ctx.fillStyle = "#fff";
          ctx.font = "9px ui-sans-serif, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(score), (x / 100) * rect.width, (y / 100) * rect.height);
        }
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [pins]);

  function pick(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * 100;
    const py = ((event.clientY - rect.top) / rect.height) * 100;
    let best: Facility | null = null;
    let bestDist = 2.4;
    for (const f of pins) {
      const { x, y } = projectKorea(f.lat, f.lng);
      const dist = Math.hypot(x - px, y - py);
      const limit = isLicensedId(f.id) ? 1.2 : 2.4;
      if (dist < Math.min(bestDist, limit)) {
        best = f;
        bestDist = dist;
      }
    }
    if (best) setSelected(best);
  }

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
            className={`btn min-h-11 ${filter === id ? "btn-ink" : "btn-ghost"}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        ref={wrapRef}
        className="relative mt-6 aspect-[3/4] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[linear-gradient(180deg,#d7e4da,#efe6d8)] sm:aspect-[4/3]"
      >
        <p className="pointer-events-none absolute left-4 top-4 z-10 text-xs text-[var(--ink-soft)]">점 = 좌표 있는 곳</p>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full cursor-pointer"
          onClick={pick}
          role="img"
          aria-label="전국 사우나 위치 지도. 점을 누르면 시설이 열립니다."
        />
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
