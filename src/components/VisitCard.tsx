"use client";

import { getFacility } from "@/data/facilities";
import { regions } from "@/data/regions";
import { useApp } from "@/context/AppState";
import type { Visit } from "@/lib/types";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function VisitCard({ visit }: { visit: Visit }) {
  const facility = getFacility(visit.facilityId);
  const { likeVisit } = useApp();
  if (!facility) return null;
  const region = regions.find((r) => r.id === facility.regionId)?.name;

  return (
    <article className="panel overflow-hidden">
      {visit.photo ? (
        <div className="relative aspect-[16/9]">
          <Image src={visit.photo} alt={`${facility.name} 사활 사진`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
        </div>
      ) : null}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium text-[var(--ink)]">{visit.userName}</p>
          <time className="text-[var(--muted)]" dateTime={visit.date}>
            {visit.date.replaceAll("-", ".")}
          </time>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">{visit.visitNumber}번째 방문</p>
        <Link href={`/saunas/${facility.id}`} className="mt-3 inline-block font-serif text-lg text-[var(--ink)] hover:text-[var(--ember-deep)]">
          {facility.name}
        </Link>
        <p className="text-xs text-[var(--muted)]">
          {region} {facility.district}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{visit.body}</p>
        {visit.food ? (
          <p className="mt-3 rounded-xl bg-[var(--cream-2)] px-3 py-2 text-sm text-[var(--ink)]">
            <span className="text-xs font-semibold text-[var(--muted)]">오늘 먹은 것 · </span>
            {visit.food}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {visit.saunaTemps.map((t) => (
            <span key={`h-${t}`} className="rounded-full bg-[var(--ember-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--ember-deep)]">
              사우나 {t}°C
            </span>
          ))}
          {visit.plungeTemps.map((t) => (
            <span key={`c-${t}`} className="rounded-full bg-[var(--moss-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--moss)]">
              냉탕 {t}°C
            </span>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--ember)]"
          aria-label={`좋아요 ${visit.likes}`}
          onClick={() => likeVisit(visit.id)}
        >
          <Heart className="size-4" aria-hidden />
          {visit.likes}
        </button>
      </div>
    </article>
  );
}
