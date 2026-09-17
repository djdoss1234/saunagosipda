import { hasKoreaCoords, isLicensedId, tempsKnown } from "@/data/places";
import { regions } from "@/data/regions";
import { formatCount, formatWon } from "@/lib/format";
import type { Facility } from "@/lib/types";
import { Droplets, Flame, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function sourceLabel(facility: Facility) {
  if (facility.id.startsWith("user-")) return "이용자 제보";
  if (isLicensedId(facility.id)) return "인허가";
  return facility.featured ? "대표 시드" : "편집 시드";
}

function coverTone(id: string) {
  let n = 0;
  for (const ch of id) n = (n * 33 + ch.charCodeAt(0)) >>> 0;
  return n % 3;
}

const tiles = [
  "from-[#3b2418] via-[#7a3412] to-[#c2410c]",
  "from-[#1f2a22] via-[#3f5c48] to-[#6b8f71]",
  "from-[#1a1410] via-[#3f2a1e] to-[#8a5a32]",
];

export function FacilityCover({
  facility,
  className = "",
  sizes,
  priority = false,
}: {
  facility: Facility;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (facility.cover) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={facility.cover}
          alt={`${facility.name} 사진`}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${tiles[coverTone(facility.id)]} ${className}`}>
      <div className="cover-mist absolute inset-0" />
      <div className="relative flex h-full min-h-[9rem] flex-col justify-between p-4 text-white">
        <p className="text-[11px] tracking-[0.18em] text-white/70">{facility.type}</p>
        <p className="font-serif text-4xl leading-none">{facility.name.slice(0, 1)}</p>
        <p className="text-sm text-white/80">{facility.district}</p>
      </div>
    </div>
  );
}

export function TempPills({ facility }: { facility: Facility }) {
  if (!tempsKnown(facility)) {
    return <span className="text-xs text-[var(--muted)]">온도 미확인</span>;
  }
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
  const placed = hasKoreaCoords(facility.lat, facility.lng);
  const licensed = isLicensedId(facility.id);
  const price = formatWon(facility.priceFrom);
  const hoursUnknown = facility.hours === "영업시간 미확인";
  const source = sourceLabel(facility);

  return (
    <Link
      href={`/saunas/${facility.id}`}
      className="group grid overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] md:grid-cols-[220px_1fr]"
    >
      <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[168px]">
        <FacilityCover facility={facility} className="absolute inset-0" sizes="(max-width: 768px) 100vw, 220px" />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium text-white ${
            source === "인허가" ? "bg-[var(--moss)]/90" : source === "대표 시드" ? "bg-[var(--ember)]/90" : "bg-[var(--ink)]/80"
          }`}
        >
          {source}
        </span>
        {rank ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[var(--ink)]">
            {rank}위
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-xs text-[var(--muted)]">
            {facility.type} · {region} {facility.district}
          </p>
          <h3 className="mt-1 font-serif text-xl leading-snug text-[var(--ink)]">{facility.name}</h3>
        </div>
        <TempPills facility={facility} />
        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          {licensed ? facility.address : facility.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          {price !== "요금 미확인" ? <span>{price}</span> : null}
          {hoursUnknown ? null : <span>{facility.hours}</span>}
          {placed ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden />
              지도
            </span>
          ) : (
            <span>좌표 없음</span>
          )}
          {facility.wantCount > 0 ? <span>가고싶어요 {formatCount(facility.wantCount)}</span> : null}
          {facility.visitCount > 0 ? <span>사활 {formatCount(facility.visitCount)}</span> : null}
        </div>
      </div>
    </Link>
  );
}
