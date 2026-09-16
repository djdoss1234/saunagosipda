"use client";

import { FacilityCard } from "@/components/FacilityCard";
import { useApp } from "@/context/AppState";

export function RankingsLists() {
  const { catalog } = useApp();
  const byWant = [...catalog].sort((a, b) => b.wantCount - a.wantCount);
  const byVisit = [...catalog].sort((a, b) => b.visitCount - a.visitCount);

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-2">
      <section>
        <h2 className="font-serif text-2xl">가고싶어요순</h2>
        <div className="mt-4 grid gap-4">
          {byWant.slice(0, 8).map((f, i) => (
            <FacilityCard key={f.id} facility={f} rank={i + 1} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-serif text-2xl">사활순</h2>
        <div className="mt-4 grid gap-4">
          {byVisit.slice(0, 8).map((f, i) => (
            <FacilityCard key={`v-${f.id}`} facility={f} rank={i + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}
