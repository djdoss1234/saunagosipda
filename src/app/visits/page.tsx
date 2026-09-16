"use client";

import { VisitCard } from "@/components/VisitCard";
import { useApp } from "@/context/AppState";

export default function VisitsPage() {
  const { visits } = useApp();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl">사활</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">다녀온 기록과 입소문이 시간순으로 쌓입니다.</p>
      <div className="mt-8 grid gap-6">
        {visits.map((v) => (
          <VisitCard key={v.id} visit={v} />
        ))}
      </div>
    </div>
  );
}
