"use client";

import { VisitCard } from "@/components/VisitCard";
import { useApp } from "@/context/AppState";

export default function VisitsPage() {
  const { visits } = useApp();
  return (
    <div className="page-wrap max-w-3xl py-10">
      <p className="kicker">Visits</p>
      <h1 className="mt-2 font-serif text-3xl">사활</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">다녀온 기록과 입소문이 시간순으로 쌓입니다.</p>
      <div className="mt-8 grid gap-6">
        {visits.map((v) => (
          <VisitCard key={v.id} visit={v} />
        ))}
      </div>
    </div>
  );
}
