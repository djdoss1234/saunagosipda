import { regions } from "@/data/regions";
import { formatCount, formatWon } from "@/lib/format";
import type { Facility } from "@/lib/types";
import { Droplets, Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function TempPills({ facility }: { facility: Facility }) {
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
  return (
    <Link
      href={`/saunas/${facility.id}`}
      className="group grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] md:grid-cols-[220px_1fr]"
    >
      <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[160px]">
        <Image
          src={facility.cover}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 220px"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        {rank ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--ink)]/85 px-2.5 py-1 text-xs font-semibold text-white">
            {rank}위
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-xs text-[var(--muted)]">
            {facility.type} · {region} {facility.district}
          </p>
          <h3 className="mt-1 font-serif text-xl text-[var(--ink)]">{facility.name}</h3>
        </div>
        <TempPills facility={facility} />
        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--ink-soft)]">{facility.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          <span>{formatWon(facility.priceFrom)}~</span>
          <span>{facility.hours}</span>
          <span>가고싶어요 {formatCount(facility.wantCount)}</span>
          <span>사활 {formatCount(facility.visitCount)}</span>
        </div>
      </div>
    </Link>
  );
}
