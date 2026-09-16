"use client";

import { TotonoiMap } from "@/components/TotonoiMap";
import { useApp } from "@/context/AppState";
import { regionGroups, regions } from "@/data/regions";
import { formatCount } from "@/lib/format";
import Link from "next/link";

export function MapExplorer() {
  const { catalog } = useApp();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl">토토노이 지도</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">점 숫자는 토토노이 루프 적합 점수입니다. 아래는 시·도 목록입니다.</p>
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
                  const list = catalog.filter((f) => f.regionId === r.id);
                  const wants = list.reduce((s, f) => s + f.wantCount, 0);
                  return (
                    <Link
                      key={r.id}
                      href={`/search?region=${r.id}`}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] transition hover:-translate-y-0.5"
                    >
                      <p className="font-serif text-2xl">{r.name}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {list.length}개 시설 · 가고싶어요 {formatCount(wants)}
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
