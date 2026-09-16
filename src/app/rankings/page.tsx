import { FacilityCard } from "@/components/FacilityCard";
import { facilities } from "@/data/facilities";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "랭킹" };

export default function RankingsPage() {
  const byWant = [...facilities].sort((a, b) => b.wantCount - a.wantCount);
  const byVisit = [...facilities].sort((a, b) => b.visitCount - a.visitCount);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl">랭킹</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">가고싶어요는 기대, 사활은 발걸음입니다.</p>
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
    </div>
  );
}
