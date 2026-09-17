"use client";

import { TotonoiMap } from "@/components/TotonoiMap";
import { useApp } from "@/context/AppState";
import { regionGroups, regions } from "@/data/regions";
import { formatCount } from "@/lib/format";
import Link from "next/link";
import { useMemo } from "react";

export function MapExplorer() {
  const { catalog } = useApp();
  const counts = useMemo(() => {
    const n = new Map<string, { places: number; wants: number }>();
    for (const f of catalog) {
      const cur = n.get(f.regionId) ?? { places: 0, wants: 0 };
      cur.places += 1;
      cur.wants += f.wantCount;
      n.set(f.regionId, cur);
    }
    return n;
  }, [catalog]);

  return (
    <div className="page-wrap py-10">
      <p className="kicker">Map</p>
      <h1 className="mt-2 font-serif text-3xl">토토노이 지도</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">대표 시설은 점수, 인허가는 작은 점입니다. 좌표가 없는 업소는 그리지 않습니다.</p>
      <div className="mt-8">
        <TotonoiMap />
      </div>
      <div className="mt-14 space-y-10">
        {regionGroups.map((group) => (
          <section key={group}>
            <h2 className="font-serif text-xl">{group}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {regions
                .filter((r) => r.group === group)
                .map((r) => {
                  const stat = counts.get(r.id) ?? { places: 0, wants: 0 };
                  return (
                    <Link key={r.id} href={`/search?region=${r.id}`} className="panel p-5 transition duration-200 hover:-translate-y-0.5">
                      <p className="font-serif text-2xl">{r.name}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {stat.places}개 시설 · 가고싶어요 {formatCount(stat.wants)}
                      </p>
                    </Link>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
