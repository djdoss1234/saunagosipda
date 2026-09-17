import { hasKoreaCoords, tempsKnown } from "@/data/places";
import { regions } from "@/data/regions";
import { formatCount, formatWon } from "@/lib/format";
import type { Facility } from "@/lib/types";
import { Droplets, Flame } from "lucide-react";
import Link from "next/link";

function coverTone(id: string) {
  let n = 0;
  for (const ch of id) n = (n * 33 + ch.charCodeAt(0)) >>> 0;
  return n % 3;
}

const tiles = ["bg-[#3b2418]", "bg-[#243028]", "bg-[#2a221c]"];

export function FacilityCover({
  facility,
  className = "",
}: {
  facility: Facility;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${tiles[coverTone(facility.id)]} ${className}`}>
      <div className="relative flex h-full min-h-[7rem] flex-col justify-between p-4 text-white">
        <p className="text-xs text-white/70">{facility.type}</p>
        <p className="font-serif text-3xl leading-none">{facility.name.slice(0, 1)}</p>
        <p className="text-sm text-white/80">{facility.district}</p>
      </div>
    </div>
  );
}

export function TempPills({ facility }: { facility: Facility }) {
  if (!tempsKnown(facility)) return null;
  const hot = Math.max(...facility.saunas.map((s) => s.tempC));
  const cold = Math.min(...facility.plunges.map((s) => s.tempC));
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ember-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--ember-deep)]">
        <Flame className="size-3.5" aria-hidden />
        {hot}°C
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--moss-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--moss)]">
        <Droplets className="size-3.5" aria-hidden />
        {cold}°C
      </span>
    </div>
  );
}

export function FacilityCard({ facility, rank }: { facility: Facility; rank?: number }) {
  const region = regions.find((r) => r.id === facility.regionId)?.name;
  const price = formatWon(facility.priceFrom);
  const hoursUnknown = facility.hours === "영업시간 미확인";

  return (
    <Link
      href={`/saunas/${facility.id}`}
      className="group flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--ember)]"
    >
      <div className="hidden size-16 shrink-0 overflow-hidden rounded-xl sm:block">
        <FacilityCover facility={facility} className="h-full min-h-0" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--muted)]">
          {rank ? `${rank} · ` : ""}
          {facility.type} · {region} {facility.district}
        </p>
        <h3 className="mt-0.5 font-serif text-xl leading-snug">{facility.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <TempPills facility={facility} />
          {price !== "요금 미확인" ? <span className="text-xs text-[var(--muted)]">{price}</span> : null}
          {hoursUnknown ? null : <span className="text-xs text-[var(--muted)]">{facility.hours}</span>}
          {facility.wantCount > 0 ? <span className="text-xs text-[var(--muted)]">가고싶어요 {formatCount(facility.wantCount)}</span> : null}
          {!hasKoreaCoords(facility.lat, facility.lng) ? <span className="text-xs text-[var(--muted)]">좌표 없음</span> : null}
        </div>
      </div>
    </Link>
  );
}
