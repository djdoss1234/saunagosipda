"use client";

import { VisitCard } from "@/components/VisitCard";
import { useApp } from "@/context/AppState";

export default function VisitsPage() {
  const { visits } = useApp();
  return (
    <div className="page-wrap max-w-3xl py-10">
      <h1 className="font-serif text-3xl">방문</h1>
      <div className="mt-8 grid gap-6">
        {visits.map((v) => (
          <VisitCard key={v.id} visit={v} />
        ))}
      </div>
    </div>
  );
}
