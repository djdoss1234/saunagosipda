"use client";

import { SetBar } from "@/components/SetBar";
import { useApp } from "@/context/AppState";
import { fmtStay, setsMeasured, SOURCE_LABEL, TOTONOI_LABELS } from "@/harness/records";
import type { SessionRecord } from "@/lib/types";
import { ChevronRight, Heart, Lock } from "lucide-react";
import Link from "next/link";

export function placeLabel(r: Pick<SessionRecord, "placeName">) {
  return r.placeName;
}

export function fmtDate(date: string) {
  const [, m, d] = date.split("-");
  const day = "일월화수목금토"[new Date(`${date}T00:00:00`).getDay()];
  return `${+m}.${+d} ${day}`;
}

/** 토토노이 = 숫자 + 말. 점·별 대신 글자로. */
export function TotonoiTag({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  return (
    <span className={`inline-flex items-baseline gap-1 font-semibold text-rest ${size === "md" ? "text-[14px]" : "text-[12px]"}`}>
      <span className="num">토토노이 {value}</span>
      <span className="font-normal">{TOTONOI_LABELS[value as 1]}</span>
    </span>
  );
}

function facts(r: SessionRecord) {
  return [r.sets.length ? `${r.sets.length}세트` : null, r.stayMin ? `머문 시간 ${fmtStay(r.stayMin)}` : null, r.saunaTempC ? `사우나 ${r.saunaTempC}°` : null, r.plungeTempC ? `냉탕 ${r.plungeTempC}°` : null].filter(Boolean).join(" · ");
}

/** 내 기록 한 줄 */
export function RecordRow({ r }: { r: SessionRecord }) {
  return (
    <Link href={`/new?edit=${r.id}`} className="flex items-center gap-3 py-3.5">
      <span className="num w-12 shrink-0 text-[13px] whitespace-nowrap text-muted">{fmtDate(r.date)}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-semibold">{r.placeName}</span>
          {!r.public ? <Lock className="size-3 shrink-0 text-muted" aria-label="나만 보기" /> : null}
        </span>
        <span className="mt-1 flex items-center gap-2.5">
          <SetBar sets={r.sets} compact />
          <TotonoiTag value={r.totonoi} />
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-fill-2" aria-hidden />
    </Link>
  );
}

/** 피드·시설 화면의 기록 = 후기 */
export function RecordCard({ r, showPlace = true }: { r: SessionRecord; showPlace?: boolean }) {
  const { liked, like, user } = useApp();
  const mine = user?.id === r.userId;
  const hasLiked = liked.includes(r.id);
  const f = facts(r);
  return (
    <article className="grid gap-2.5 py-5">
      <header className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-fill text-[13px] font-semibold text-ink-soft" aria-hidden>
          {r.userName.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{r.userName}</span>
        <time dateTime={r.date} className="num text-[12px] text-muted">
          {fmtDate(r.date)}
        </time>
      </header>
      {showPlace ? (
        r.placeId ? (
          <Link href={`/saunas/${r.placeId}`} className="text-[17px] font-bold tracking-[-0.025em]">
            {r.placeName}
          </Link>
        ) : (
          <p className="text-[17px] font-bold tracking-[-0.025em]">{r.placeName}</p>
        )
      ) : null}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TotonoiTag value={r.totonoi} size="md" />
        {f ? <span className="num text-[13px] text-muted">{f}</span> : null}
      </div>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SetBar sets={r.sets} />
        </div>
        {r.sets.length ? (
          <span className="shrink-0 text-[11px] text-muted" title={SOURCE_LABEL[r.source]}>
            {setsMeasured(r.source) ? "측정" : "추정"}
          </span>
        ) : null}
      </div>
      {r.memo ? <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-soft">{r.memo}</p> : null}
      {r.food ? <p className="text-[13px] text-muted">먹은 것 · {r.food}</p> : null}
      <footer className="flex items-center">
        <button
          type="button"
          onClick={() => like(r.id)}
          disabled={hasLiked || mine}
          aria-pressed={hasLiked}
          className="-ml-1.5 inline-flex min-h-9 items-center gap-1 rounded-lg px-1.5 text-[13px] text-muted enabled:hover:text-heat"
        >
          <Heart className={`size-[18px] ${hasLiked ? "fill-heat text-heat" : ""}`} strokeWidth={1.8} aria-hidden />
          <span className="num">{r.likes}</span>
          <span className="sr-only">좋아요</span>
        </button>
        {mine ? (
          <Link href={`/new?edit=${r.id}`} className="ml-auto text-[13px] text-muted">
            수정
          </Link>
        ) : null}
      </footer>
    </article>
  );
}
