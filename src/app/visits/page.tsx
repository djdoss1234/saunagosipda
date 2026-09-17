"use client";

import { VisitCard } from "@/components/VisitCard";
import { useApp } from "@/context/AppState";

export default function VisitsPage() {
  const { visits } = useApp();
  return (
    <div className="page-wrap max-w-3xl py-10">
      <p className="kicker">Visits</p>
      <h1 className="mt-2 font-serif text-3xl">방문 기록</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        이키타이에서 사활이라고 부르는 것과 같습니다. 다녀온 날의 온도와 한 줄이지, 별점이 아닙니다.
      </p>
      <div className="mt-8 grid gap-6">
        {visits.map((v) => (
          <VisitCard key={v.id} visit={v} />
        ))}
      </div>
    </div>
  );
}
