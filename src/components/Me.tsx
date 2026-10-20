"use client";

import { RecordRow } from "@/components/RecordCard";
import { useApp } from "@/context/AppState";
import { byNewest, exitPulse, fmtDur, fmtStay, GUIDE, INSIGHT_MIN_N, insights, monthSummary, recordMonths, routine, stats, toCSV, validRestingHr } from "@/harness/records";
import { Check, ChevronLeft, ChevronRight, Download, HeartPulse, PencilLine, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { totoColor } from "@/lib/toto";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const monthLabel = (ym: string) => `${+ym.slice(0, 4)}년 ${+ym.slice(5, 7)}월`;

/** 마이 = 쌓인 기록. 숫자 셋 → 루틴 vs 책 → 월별 전체 목록 → 데이터. */
export function Me() {
  const { ready, user, records, setName, resetAll, restingHr, setRestingHr } = useApp();
  const [monthIdx, setMonthIdx] = useState(0);
  const [hrDraft, setHrDraft] = useState<string | null>(null);
  const saved = useSearchParams().get("saved");
  const [name, setNameDraft] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  if (!ready) return <div className="h-96" aria-busy="true" />;

  const s = stats(records);
  const r = routine(records);
  const ins = insights(records);
  const pulse = restingHr ? exitPulse(restingHr) : null;
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
    <div className="grid gap-3 pt-3">
      {saved ? (
        <p role="status" className="card flex items-center gap-2 py-3.5 text-[15px] font-semibold text-rest">
          <Check className="size-4" strokeWidth={2.6} aria-hidden /> 기록했어요
        </p>
      ) : null}

      <section className="flex items-center gap-3 px-1 pb-1">
        {name === null ? (
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-surface text-[18px] font-bold text-ink-soft" aria-hidden>
              {(user?.name ?? "나").slice(0, 1)}
            </span>
            <h1 className="title-xl min-w-0 flex-1 truncate text-[24px]">{user?.name ?? "아직 기록이 없어요"}</h1>
            {user ? (
              <button type="button" className="chip chip-raised gap-1" onClick={() => setNameDraft(user.name)}>
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

      <MonthCard records={records} months={recordMonths(records)} idx={monthIdx} setIdx={setMonthIdx} streak={s.streakWeeks} />

      <section aria-labelledby="ins" className="card grid gap-1">
        <h2 id="ins" className="card-title">
          무엇이 토토노이를 올렸나
        </h2>
        <p className="text-[13px] text-muted">조건이 있을 때와 없을 때의 평균 차이. 양쪽 다 {INSIGHT_MIN_N}회 이상 쌓인 것만 보여요.</p>
        {ins.length ? (
          <ul className="mt-2">
            {ins.slice(0, 6).map((x) => (
              <li key={x.key} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                {x.diff > 0 ? (
                  <TrendingUp className="size-[18px] shrink-0 text-rest" aria-hidden />
                ) : (
                  <TrendingDown className="size-[18px] shrink-0 text-muted" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{x.label}</span>
                  <span className="num text-[12px] text-muted">
                    있을 때 {x.withAvg} ({x.n}회) · 없을 때 {x.withoutAvg} ({x.nOther}회)
                  </span>
                </span>
                <span className={`num text-[17px] font-bold ${x.diff > 0 ? "text-rest" : "text-muted"}`}>
                  {x.diff > 0 ? "+" : ""}
                  {x.diff.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 rounded-2xl bg-fill px-4 py-4 text-[14px] leading-relaxed text-ink-soft">
            아직 비교할 만큼 쌓이지 않았어요. 외기욕 자세·장소, 온도, 입장 시각을 같이 남기면 더 빨리 보여요.
          </p>
        )}
      </section>

      {r ? (
        <section aria-labelledby="rt" className="card grid gap-1">
          <h2 id="rt" className="card-title">
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

      <section aria-labelledby="hr" className="card grid gap-2">
        <h2 id="hr" className="card-title">
          나올 맥박
        </h2>
        {hrDraft === null ? (
          <button type="button" onClick={() => setHrDraft(restingHr ? String(restingHr) : "")} className="press flex items-center gap-3 rounded-2xl bg-fill px-4 py-3.5 text-left">
            <HeartPulse className="size-5 shrink-0 text-heat" strokeWidth={1.9} aria-hidden />
            {pulse ? (
              <span className="min-w-0 flex-1">
                <span className="num block text-[15px]">
                  평소 <b className="font-semibold">{restingHr}</b> → 아침 <b className="font-semibold">{pulse.morning}</b> · 밤 <b className="font-semibold">{pulse.night}</b> bpm쯤에서 나오기
                </span>
                <span className="text-[12px] text-muted">평소 맥박의 2배, 단 아침 110·밤 130을 넘기지 않게</span>
              </span>
            ) : (
              <span className="min-w-0 flex-1 text-[15px]">
                평소 맥박을 넣으면 사우나에서 나올 맥박을 알려 드려요
                <span className="block text-[12px] text-muted">아침에 일어나 1분 재면 돼요</span>
              </span>
            )}
            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
          </button>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(hrDraft);
              if (!hrDraft.trim()) setRestingHr(null);
              else if (validRestingHr(n)) setRestingHr(Math.round(n));
              else return;
              setHrDraft(null);
            }}
          >
            <label htmlFor="rhr" className="sr-only">
              평소 맥박(bpm)
            </label>
            <span className="relative flex-1">
              <input id="rhr" className="field num pr-14" inputMode="numeric" placeholder="60" value={hrDraft} onChange={(e) => setHrDraft(e.target.value.replace(/\D/g, "").slice(0, 3))} autoFocus />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[14px] text-muted">bpm</span>
            </span>
            <button type="submit" className="btn-ink shrink-0 px-5" disabled={!!hrDraft.trim() && !validRestingHr(Number(hrDraft))}>
              저장
            </button>
          </form>
        )}
        <p className="text-[12px] text-muted">이 기기에만 저장돼요. 책의 안내값이고 의학 조언이 아니에요. 어지러우면 맥박과 상관없이 바로 나오세요.</p>
      </section>

      {[...byMonth.entries()].map(([month, list]) => (
        <section key={month} aria-labelledby={`m-${month}`} className="card pb-1">
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
        <Link href="/" className="btn-ink mt-1">
          첫 기록 남기기
        </Link>
      ) : null}

      <section className="card grid gap-3" aria-label="데이터">
        <button type="button" onClick={exportCSV} disabled={!records.length} className="btn-fill w-full disabled:opacity-40">
          <Download className="size-[18px]" aria-hidden /> 내 기록 CSV로 받기
        </button>
        <p className="text-[12px] leading-relaxed text-muted">기록은 이 기기에 저장되고, 공개한 기록만 피드에 올라가요. 기기를 바꾸기 전에 CSV로 받아 두세요.</p>
        {confirmReset ? (
          <div className="flex items-center justify-between rounded-2xl bg-heat-soft px-4 py-3">
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

function MonthCard({
  records,
  months,
  idx,
  setIdx,
  streak,
}: {
  records: Parameters<typeof monthSummary>[0];
  months: string[];
  idx: number;
  setIdx: (n: number) => void;
  streak: number;
}) {
  const ym = months[Math.min(idx, months.length - 1)];
  const m = monthSummary(records, ym);
  const label = `${+ym.slice(0, 4)}년 ${+ym.slice(5, 7)}월`;
  return (
    <section aria-label="월간 요약" className="card grid gap-4">
      <div className="-mx-2 -mt-2 flex items-center">
        <button type="button" aria-label="이전 달" disabled={idx >= months.length - 1} onClick={() => setIdx(idx + 1)} className="press flex size-10 items-center justify-center rounded-full disabled:opacity-25">
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <h2 className="flex-1 text-center text-[15px] font-semibold text-ink-soft">{label}</h2>
        <button type="button" aria-label="다음 달" disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="press flex size-10 items-center justify-center rounded-full disabled:opacity-25">
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
      <div className="flex items-end justify-between gap-4">
        <p className="grid gap-1">
          <span className="num text-[64px] leading-none font-bold tracking-[-0.05em]">{m.count}</span>
          <span className="text-[14px] text-muted">번 다녀왔어요</span>
        </p>
        <p className="grid justify-items-end gap-1 pb-1">
          <span className="num text-[28px] leading-none font-bold" style={{ color: m.avgTotonoi ? totoColor(m.avgTotonoi) : "var(--muted)" }}>
            {m.avgTotonoi ?? "–"}
          </span>
          <span className="text-[12px] text-muted">평균 토토노이</span>
        </p>
      </div>
      <TotoTrend records={records.filter((r) => r.date.startsWith(ym))} />
      <dl className="grid grid-cols-4 gap-y-4 border-t border-line pt-4 text-center">
        {[
          { k: "시설", v: m.places },
          { k: "세트", v: m.sets },
          { k: "머문 시간", v: m.stayCount ? fmtStay(m.stayMin) : "–" },
          { k: idx === 0 ? "연속 주" : "", v: idx === 0 ? streak : "" },
        ]
          .filter((x) => x.k)
          .map((x, i) => (
            <div key={i} className="flex flex-col-reverse">
              <dt className="mt-1 text-[12px] text-muted">{x.k}</dt>
              <dd className="num text-[20px] font-bold">{x.v}</dd>
            </div>
          ))}
      </dl>
      {m.stayCount && m.stayCount < m.count ? <p className="text-[12px] text-muted">머문 시간은 사물함 타이머로 잰 {m.stayCount}번의 합이에요.</p> : null}
      {m.topPlaces.length ? (
        <ol className="grid gap-1">
          {m.topPlaces.map((p, i) => (
            <li key={p.placeId ?? p.placeName} className="flex items-center gap-3 text-[14px]">
              <span className="num w-4 text-muted">{i + 1}</span>
              {p.placeId ? (
                <Link href={`/saunas/${p.placeId}`} className="min-w-0 flex-1 truncate">
                  {p.placeName}
                </Link>
              ) : (
                <span className="min-w-0 flex-1 truncate">{p.placeName}</span>
              )}
              <span className="num text-muted">{p.count}회</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

/** 이달 방문마다 토토노이 한 점. 선은 흐름만 보여 주고, 점 색이 사우나 한 바퀴의 단계다. */
function TotoTrend({ records }: { records: Parameters<typeof monthSummary>[0] }) {
  const pts = [...records].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).slice(-24);
  const W = 320;
  const H = 120;
  const pad = 12;
  if (pts.length < 2) {
    return (
      <div className="grid h-[120px] place-content-center rounded-2xl border border-dashed border-line-strong text-[13px] text-muted">
        두 번 이상 기록하면 흐름이 그려져요
      </div>
    );
  }
  const x = (i: number) => pad + (i * (W - pad * 2)) / (pts.length - 1);
  const y = (v: number) => H - pad - ((v - 1) / 4) * (H - pad * 2);
  const d = pts.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(r.totonoi).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[120px] w-full" role="img" aria-label={`이달 토토노이 ${pts.map((r) => r.totonoi).join(", ")}`}>
      {[1, 3, 5].map((v) => (
        <g key={v}>
          <line x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
          <text x={W - pad} y={y(v) - 4} textAnchor="end" fontSize="10" fill="var(--muted)">
            {v}
          </text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
      {pts.map((r, i) => (
        <circle key={r.id} cx={x(i)} cy={y(r.totonoi)} r="4.5" fill={totoColor(r.totonoi)} />
      ))}
    </svg>
  );
}
