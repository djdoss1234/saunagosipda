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
    const n = new Map<string, number>();
    for (const f of catalog) n.set(f.regionId, (n.get(f.regionId) ?? 0) + 1);
    return n;
  }, [catalog]);

  return (
    <div className="page-wrap py-10">
      <h1 className="font-serif text-3xl">지도</h1>
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
                  const n = counts.get(r.id) ?? 0;
                  return (
                    <Link key={r.id} href={`/search?region=${r.id}`} className="panel p-5 transition duration-200 hover:-translate-y-0.5">
                      <p className="font-serif text-2xl">{r.name}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">{formatCount(n)}곳</p>
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
