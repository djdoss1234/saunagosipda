"use client";

import { FacilityDetail } from "@/components/FacilityDetail";
import { useApp } from "@/context/AppState";
import type { Facility } from "@/lib/types";
import Link from "next/link";

export function LiveFacility({
  id,
  fallback,
  related,
}: {
  id: string;
  fallback: Facility;
  related: Facility[];
}) {
  const { catalog, ready } = useApp();
  const facility = (ready ? catalog.find((f) => f.id === id) : undefined) ?? fallback;
  const liveRelated = related.map((item) => catalog.find((f) => f.id === item.id) ?? item);
  return <FacilityDetail facility={facility} related={liveRelated} />;
}

export function ClientFacilityPage({ id }: { id: string }) {
  const { catalog, ready } = useApp();
  if (!ready) {
    return <p className="px-4 py-16 text-center text-sm text-[var(--muted)]">시설을 불러오는 중…</p>;
  }
  const facility = catalog.find((f) => f.id === id);
  if (!facility) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">시설을 찾을 수 없습니다</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">검수 전이거나, 이 브라우저에 없는 제보 시설일 수 있습니다.</p>
        <Link href="/search" className="btn-primary btn mt-6">
          검색으로
        </Link>
      </div>
    );
  }
  const related = catalog.filter((f) => f.regionId === facility.regionId && f.id !== facility.id).slice(0, 3);
  return <FacilityDetail facility={facility} related={related} />;
}
