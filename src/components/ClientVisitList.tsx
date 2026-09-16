"use client";

import { VisitCard } from "@/components/VisitCard";
import { useApp } from "@/context/AppState";
import type { Visit } from "@/lib/types";

export function ClientVisitList({ facilityId }: { facilityId: string }) {
  const { visits } = useApp();
  const list = visits.filter((v: Visit) => v.facilityId === facilityId);
  if (!list.length) {
    return <p className="mt-4 text-sm text-[var(--muted)]">아직 사활이 없습니다. 첫 기록을 남겨 주세요.</p>;
  }
  return (
    <div className="mt-6 grid gap-6">
      {list.map((v) => (
        <VisitCard key={v.id} visit={v} />
      ))}
    </div>
  );
}
