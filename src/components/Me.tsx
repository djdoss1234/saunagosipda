"use client";

import { RecordRow } from "@/components/RecordCard";
import { useApp } from "@/context/AppState";
import { byNewest, fmtDur, GUIDE, routine, stats, toCSV } from "@/harness/records";
import { Check, Download, PencilLine } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const monthLabel = (ym: string) => `${+ym.slice(0, 4)}년 ${+ym.slice(5, 7)}월`;

/** 마이 = 쌓인 기록. 숫자 셋 → 루틴 vs 책 → 월별 전체 목록 → 데이터. */
export function Me() {
  const { ready, user, records, setName, resetAll } = useApp();
  const saved = useSearchParams().get("saved");
  const [name, setNameDraft] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  if (!ready) return <div className="h-96" aria-busy="true" />;

  const s = stats(records);
  const r = routine(records);
  const maxMonth = Math.max(1, ...s.months.map((m) => m.count));
  const byMonth = new Map<string, typeof records>();
  for (const rec of [...records].sort(byNewest)) byMonth.set(rec.date.slice(0, 7), [...(byMonth.get(rec.date.slice(0, 7)) ?? []), rec]);

  function exportCSV() {
    const blob = new Blob(["﻿" + toCSV(records)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `saunagosipda-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const compare = r
    ? [
        { label: "사우나", mine: r.saunaSec, guide: "평소 맥박의 2배쯤에서 나오기", ok: r.saunaSec >= 300 && r.saunaSec <= 720, bar: "bg-heat" },
        { label: "냉탕", mine: r.plungeSec, guide: "약 1분, 16~17°C", ok: r.plungeSec >= 30 && r.plungeSec <= 120, bar: "bg-cold" },
        { label: "외기욕", mine: r.restSec, guide: "누워서 5~10분", ok: r.restSec >= 300 && r.restSec <= 600, bar: "bg-rest" },
      ]
    : [];

  return (
    <div className="grid gap-7 pt-2">
      {saved ? (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-fill px-4 py-3 text-[14px] font-semibold">
          <Check className="size-4" strokeWidth={2.6} aria-hidden /> 기록했어요
        </p>
      ) : null}

      <section className="flex items-center gap-3">
        {name === null ? (
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-fill text-[18px] font-bold text-ink-soft" aria-hidden>
              {(user?.name ?? "나").slice(0, 1)}
            </span>
            <h1 className="min-w-0 flex-1 truncate text-[22px] font-bold">{user?.name ?? "아직 기록이 없어요"}</h1>
            {user ? (
              <button type="button" className="chip gap-1" onClick={() => setNameDraft(user.name)}>
                <PencilLine className="size-3.5" aria-hidden /> 이름
              </button>
            ) : null}
          </>
        ) : (
          <form
            className="flex w-full gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) setName(name);
              setNameDraft(null);
            }}
          >
            <label htmlFor="nick" className="sr-only">
              닉네임
            </label>
            <input id="nick" className="field" maxLength={20} value={name} onChange={(e) => setNameDraft(e.target.value)} autoFocus />
            <button type="submit" className="btn-ink shrink-0 px-5">
              저장
            </button>
          </form>
        )}
      </section>

      <section className="grid grid-cols-3 gap-2 text-center" aria-label="누적">
        {[
          { v: s.total, l: "방문" },
          { v: s.streakWeeks, l: "연속 주" },
          { v: s.avgTotonoi ?? "–", l: "평균 토토노이" },
        ].map((x) => (
          <div key={x.l} className="rounded-xl bg-fill py-3.5">
            <p className="num text-[22px] font-bold">{x.v}</p>
            <p className="mt-0.5 text-[12px] text-muted">{x.l}</p>
          </div>
        ))}
      </section>

      {records.length ? (
        <section aria-labelledby="mm" className="grid gap-3">
          <h2 id="mm" className="section-title">
            월별 방문
          </h2>
          <div className="flex h-24 items-end gap-2">
            {s.months.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="num text-[12px] text-muted">{m.count || ""}</span>
                <span className={`w-5 rounded-full ${m.count ? "bg-ink" : "bg-fill"}`} style={{ height: m.count ? `${(m.count / maxMonth) * 56}px` : 4 }} />
                <span className="text-[12px] text-muted">{+m.month.slice(5)}월</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {r ? (
        <section aria-labelledby="rt" className="grid gap-1">
          <h2 id="rt" className="section-title">
            내 루틴
          </h2>
          <p className="text-[13px] text-muted">기록의 중앙값과 『사우나 교과서』 권장값</p>
          <ul className="mt-2">
            {compare.map((c) => (
              <li key={c.label} className="flex items-center gap-3 border-b border-line py-3">
                <i className={`h-8 w-1 rounded-full ${c.bar}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{c.label}</span>
                  <span className="text-[12px] text-muted">{c.guide}</span>
                </span>
                <span className="text-right">
                  <span className="num block text-[16px] font-semibold">{fmtDur(c.mine)}</span>
                  <span className={`text-[12px] ${c.ok ? "text-rest" : "text-muted"}`}>{c.ok ? "권장 범위" : "범위 밖"}</span>
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between py-3">
              <span className="text-[15px] font-semibold">세트</span>
              <span className="num text-[16px] font-semibold">
                {r.sets}세트 <span className="text-[12px] font-normal text-muted">권장 {GUIDE.sets}~4</span>
              </span>
            </li>
          </ul>
          <p className="text-[12px] text-muted">책의 안내값이고 의학 조언이 아니에요. 어지러우면 바로 나오세요.</p>
        </section>
      ) : null}

      {[...byMonth.entries()].map(([month, list]) => (
        <section key={month} aria-labelledby={`m-${month}`}>
          <h2 id={`m-${month}`} className="label">
            {monthLabel(month)} · {list.length}회
          </h2>
          <ul>
            {list.map((rec) => (
              <li key={rec.id} className="border-b border-line last:border-0">
                <RecordRow r={rec} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!records.length ? (
        <Link href="/" className="btn-ink">
          첫 기록 남기기
        </Link>
      ) : null}

      <div className="divider" />

      <section className="grid gap-3" aria-label="데이터">
        <button type="button" onClick={exportCSV} disabled={!records.length} className="btn-fill w-full disabled:opacity-40">
          <Download className="size-[18px]" aria-hidden /> 내 기록 CSV로 받기
        </button>
        <p className="text-[12px] leading-relaxed text-muted">기록은 이 기기에 저장되고, 공개한 기록만 피드에 올라가요. 기기를 바꾸기 전에 CSV로 받아 두세요.</p>
        {confirmReset ? (
          <div className="flex items-center justify-between rounded-xl bg-heat-soft px-4 py-3">
            <span className="text-[14px]">이 기기의 기록을 모두 지울까요?</span>
            <span className="flex gap-1.5">
              <button type="button" className="chip bg-surface" onClick={() => setConfirmReset(false)}>
                취소
              </button>
              <button
                type="button"
                className="chip bg-heat text-white"
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                }}
              >
                지우기
              </button>
            </span>
          </div>
        ) : null}
        <div className="flex gap-4 text-[13px] text-muted">
          <Link href="/about">데이터 출처와 원칙</Link>
          {!confirmReset && records.length ? (
            <button type="button" onClick={() => setConfirmReset(true)} className="hover:text-heat">
              기록 모두 지우기
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
