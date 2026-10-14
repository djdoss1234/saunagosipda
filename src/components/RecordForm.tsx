"use client";

import { PlacePicker, type PickedPlace } from "@/components/PlacePicker";
import { LOCKER_HANDOFF_KEY } from "@/components/LockerTimer";
import { fmtDate } from "@/components/RecordCard";
import { SetBar } from "@/components/SetBar";
import { Stepper } from "@/components/Stepper";
import { useApp } from "@/context/AppState";
import { defaultSets, fmtDur, fmtStay, localDate, PACE_LABEL, paceSets, recentPlaces, setsMeasured, TOTONOI_LABELS, type Pace } from "@/harness/records";
import type { SaunaSet, SessionRecord, Totonoi } from "@/lib/types";
import { CalendarDays, ChevronDown, Timer, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export const TIMER_HANDOFF_KEY = "saunagosipda.timer.result";

type Initial = {
  edit?: SessionRecord;
  place: PickedPlace | null;
  sets: SaunaSet[];
  source: SessionRecord["source"];
  stay?: { stayMin: number; startedAt: string };
};

/** /, /new 공통 — 어디서 · 토토노이 두 번 누르면 저장. 세트는 내 루틴(없으면 책 기준)으로 미리 채워 둔다. */
export function RecordFormPage({ home = false }: { home?: boolean }) {
  const { ready, records } = useApp();
  const params = useSearchParams();
  if (!ready) return <div className="h-[420px]" aria-busy="true" />;

  const edit = home ? undefined : records.find((r) => r.id === params.get("edit"));
  let timerSets: SaunaSet[] | null = null;
  if (!home && params.get("from") === "timer") {
    try {
      timerSets = JSON.parse(sessionStorage.getItem(TIMER_HANDOFF_KEY) ?? "null") as SaunaSet[] | null;
    } catch {
      timerSets = null;
    }
  }
  let stay: Initial["stay"];
  if (!home && params.get("from") === "locker") {
    try {
      stay = JSON.parse(sessionStorage.getItem(LOCKER_HANDOFF_KEY) ?? "null") ?? undefined;
    } catch {
      stay = undefined;
    }
  }
  const placeId = params.get("place") ?? undefined;
  const placeName = params.get("name") ?? undefined;
  const initial: Initial = edit
    ? {
        edit,
        place: { placeId: edit.placeId, placeName: edit.placeName },
        sets: edit.sets,
        source: edit.source,
        stay: edit.stayMin && edit.startedAt ? { stayMin: edit.stayMin, startedAt: edit.startedAt } : undefined,
      }
    : {
        place: !home && placeId && placeName ? { placeId, placeName, area: params.get("area") ?? undefined } : null,
        sets: timerSets?.length ? timerSets : defaultSets(records),
        source: timerSets?.length ? "timer" : stay ? "locker" : "manual",
        stay,
      };
  return <RecordForm key={edit?.id ?? (home ? `home-${records.length}` : params.toString())} initial={initial} recent={recentPlaces(records, 8)} />;
}

function uniform(sets: SaunaSet[]) {
  return sets.every((s) => s.saunaSec === sets[0].saunaSec && s.plungeSec === sets[0].plungeSec && s.restSec === sets[0].restSec);
}

function RecordForm({ initial, recent }: { initial: Initial; recent: PickedPlace[] }) {
  const { user, saveRecord, deleteRecord, setName } = useApp();
  const router = useRouter();
  const [{ today, yesterday }] = useState(() => {
    const d = new Date();
    const t = localDate(d);
    d.setDate(d.getDate() - 1);
    return { today: t, yesterday: localDate(d) };
  });
  const e = initial.edit;

  const [date, setDate] = useState(e?.date ?? today);
  const [place, setPlace] = useState<PickedPlace | null>(initial.place);
  const [sets, setSets] = useState<SaunaSet[]>(initial.sets);
  const measured = setsMeasured(initial.source);
  const stay = initial.stay;
  const [openSets, setOpenSets] = useState(false);
  // 평소보다 길게/짧게: 루틴 한 세트를 기준으로 늘이고 줄인다. 직접 고치면 null(직접).
  const [base] = useState<SaunaSet>(() => initial.sets[0] ?? { saunaSec: 480, plungeSec: 60, restSec: 420 });
  const [pace, setPace] = useState<Pace | null>(e ? null : "usual");
  const [perSet, setPerSet] = useState(!uniform(initial.sets));
  const [totonoi, setTotonoi] = useState<Totonoi | null>(e?.totonoi ?? null);
  const [isPublic, setPublic] = useState(e?.public ?? true);
  const [saunaTemp, setSaunaTemp] = useState(e?.saunaTempC ? String(e.saunaTempC) : "");
  const [plungeTemp, setPlungeTemp] = useState(e?.plungeTempC ? String(e.plungeTempC) : "");
  const [memo, setMemo] = useState(e?.memo ?? "");
  const [food, setFood] = useState(e?.food ?? "");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const one = sets[0] ?? { saunaSec: 480, plungeSec: 60, restSec: 420 };
  const setAll = (patch: Partial<SaunaSet>) => {
    setPace(null);
    setSets((xs) => xs.map((s) => ({ ...s, ...patch })));
  };
  const setCount = (n: number) =>
    setSets((xs) =>
      pace ? paceSets(Array.from({ length: n }, () => base), pace) : n > xs.length ? [...xs, ...Array.from({ length: n - xs.length }, () => ({ ...(xs.at(-1) ?? one) }))] : xs.slice(0, n),
    );
  const applyPace = (p: Pace) => {
    setPace(p);
    setPerSet(false);
    setSets((xs) => paceSets(Array.from({ length: xs.length }, () => base), p));
  };
  const editSet = (i: number, patch: Partial<SaunaSet>) => {
    setPace(null);
    setSets((xs) => xs.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  };
  const num = (v: string) => (v.trim() ? Number(v) : undefined);
  const ready = !!place && !!totonoi;

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!place) return setError("어디 다녀왔는지 골라 주세요.");
    if (!totonoi) return setError("토토노이를 골라 주세요.");
    // 닉네임은 묻지 않는다. 처음 저장할 때 임시 이름을 주고, 마이에서 바꾼다.
    const who = user ?? setName(`사우너${Math.floor(1000 + Math.random() * 9000)}`);
    const res = saveRecord(
      {
        placeId: place.placeId,
        placeName: place.placeName,
        date,
        sets,
        totonoi,
        public: isPublic,
        source: initial.source,
        stayMin: stay?.stayMin,
        startedAt: stay?.startedAt,
        saunaTempC: num(saunaTemp),
        plungeTempC: num(plungeTemp),
        memo,
        food,
      },
      { id: e?.id, user: who },
    );
    if (!res.ok) return setError(res.message);
    try {
      sessionStorage.removeItem(TIMER_HANDOFF_KEY);
      sessionStorage.removeItem(LOCKER_HANDOFF_KEY);
    } catch {
      // 무시
    }
    // 저장 다음이 시설 정보·후기. 목록에 없는 곳이면 마이로.
    router.push(res.record.placeId ? `/saunas/${res.record.placeId}?saved=${res.record.id}` : `/me?saved=${res.record.id}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-7" noValidate>
      <div className="grid gap-3 pt-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[24px] leading-tight font-bold">{e ? "기록 수정" : "오늘 어디 다녀왔어요?"}</h1>
          {!e ? (
            <Link href="/live" className="chip shrink-0 gap-1.5 pl-3" aria-label="타이머로 재면서 기록">
              <Timer className="size-4" strokeWidth={2} aria-hidden />
              타이머
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" className="chip" aria-pressed={date === today} onClick={() => setDate(today)}>
            오늘
          </button>
          <button type="button" className="chip" aria-pressed={date === yesterday} onClick={() => setDate(yesterday)}>
            어제
          </button>
          <label className="chip relative" style={date !== today && date !== yesterday ? { background: "var(--ink)", color: "var(--on-ink)" } : undefined}>
            <CalendarDays className="size-4" strokeWidth={1.9} aria-hidden />
            {date !== today && date !== yesterday ? fmtDate(date) : "다른 날"}
            <input
              type="date"
              max={today}
              value={date}
              onChange={(x) => x.target.value && setDate(x.target.value)}
              aria-label="날짜 고르기"
              onClick={(x) => {
                try {
                  x.currentTarget.showPicker();
                } catch {
                  // 지원 안 하는 브라우저는 기본 동작
                }
              }}
              className="absolute inset-0 opacity-0"
            />
          </label>
        </div>
      </div>

      <section className="grid gap-2.5" aria-labelledby="l-place">
        <h2 id="l-place" className="text-[15px] font-semibold">
          사우나
        </h2>
        <PlacePicker
          value={place}
          recent={recent}
          onChange={(p) => {
            setPlace(p);
            setError("");
          }}
        />
      </section>

      <section className="grid gap-2.5" aria-labelledby="l-toto">
        <h2 id="l-toto" className="text-[15px] font-semibold">
          토토노이
        </h2>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-labelledby="l-toto">
          {([1, 2, 3, 4, 5] as Totonoi[]).map((v) => {
            const on = totonoi === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${v}, ${TOTONOI_LABELS[v]}`}
                onClick={() => {
                  setTotonoi(v);
                  setError("");
                }}
                className={`flex h-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl transition-colors ${on ? "bg-ink text-on-ink" : "bg-fill text-ink"}`}
              >
                <span className="num text-[20px] leading-none font-bold">{v}</span>
                <span className={`text-[11px] leading-none ${on ? "opacity-80" : "text-muted"}`}>{TOTONOI_LABELS[v]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-2.5" aria-labelledby="l-sets">
        <div className="flex items-baseline justify-between">
          <h2 id="l-sets" className="text-[15px] font-semibold">
            세트
          </h2>
          <span className="text-[12px] text-muted">{measured ? "단계별 측정" : "시간은 평소 루틴으로 추정"}</span>
        </div>
        {stay ? (
          <p className="num rounded-xl bg-fill px-4 py-3 text-[14px]">
            머문 시간 <b className="font-semibold">{fmtStay(stay.stayMin)}</b>
            <span className="text-muted"> · {new Date(stay.startedAt).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" })} 입장</span>
          </p>
        ) : null}
        {measured ? null : (
          <>
            <div className="rounded-xl bg-fill px-3">
              <Stepper label="몇 세트 했어요?" value={sets.length} display={`${sets.length}세트`} step={1} min={1} max={10} onChange={setCount} />
            </div>
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="세트 시간">
              {(["short", "usual", "long"] as Pace[]).map((p) => (
                <button key={p} type="button" role="radio" aria-checked={pace === p} onClick={() => applyPace(p)} className={`min-h-11 rounded-xl text-[14px] font-medium ${pace === p ? "bg-ink text-on-ink" : "bg-fill text-ink-soft"}`}>
                  {PACE_LABEL[p]}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <SetBar sets={sets} />
          </div>
          <button type="button" aria-expanded={openSets} onClick={() => setOpenSets((v) => !v)} className="flex shrink-0 items-center gap-0.5 text-[13px] text-muted">
            {measured ? "시간 보기" : "시간 직접 고치기"}
            <ChevronDown className={`size-4 transition-transform ${openSets ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>
        {openSets ? (
          <div className="rounded-xl border border-line px-3 pb-2">
            {perSet ? (
              <ol>
                {sets.map((s, i) => (
                  <li key={i} className="border-b border-line pt-2 last:border-0">
                    <p className="text-[12px] font-semibold text-muted">{i + 1}세트</p>
                    <Stepper label="사우나" tone="heat" value={s.saunaSec} display={fmtDur(s.saunaSec)} step={60} min={60} max={1800} onChange={(v) => editSet(i, { saunaSec: v })} />
                    <Stepper label="냉탕" tone="cold" value={s.plungeSec} display={fmtDur(s.plungeSec)} step={15} min={0} max={600} onChange={(v) => editSet(i, { plungeSec: v })} />
                    <Stepper label="외기욕" tone="rest" value={s.restSec} display={fmtDur(s.restSec)} step={60} min={0} max={1800} onChange={(v) => editSet(i, { restSec: v })} />
                  </li>
                ))}
              </ol>
            ) : (
              <div>
                <Stepper label="사우나" tone="heat" value={one.saunaSec} display={fmtDur(one.saunaSec)} step={60} min={60} max={1800} onChange={(v) => setAll({ saunaSec: v })} />
                <Stepper label="냉탕" tone="cold" value={one.plungeSec} display={fmtDur(one.plungeSec)} step={15} min={0} max={600} onChange={(v) => setAll({ plungeSec: v })} />
                <Stepper label="외기욕" tone="rest" value={one.restSec} display={fmtDur(one.restSec)} step={60} min={0} max={1800} onChange={(v) => setAll({ restSec: v })} />
              </div>
            )}
            <div className="flex justify-end border-t border-line pt-2">
              <button type="button" className="min-h-9 text-[13px] text-muted underline underline-offset-2" onClick={() => setPerSet((v) => !v)}>
                {perSet ? "모두 같게" : "세트마다 다르게"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <details className="group" open={!!(e?.memo || e?.saunaTempC || e?.plungeTempC || e?.food)}>
        <summary className="flex min-h-11 list-none items-center gap-1.5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
          온도 · 후기
          <span className="text-[13px] font-normal text-muted">선택</span>
          <ChevronDown className="ml-auto size-[18px] text-muted transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="grid gap-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1.5">
              <span className="label">사우나 온도</span>
              <span className="relative">
                <input className="field num pr-10" inputMode="numeric" placeholder="90" value={saunaTemp} onChange={(x) => setSaunaTemp(x.target.value.replace(/[^\d.]/g, ""))} />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] text-muted">°C</span>
              </span>
            </label>
            <label className="grid gap-1.5">
              <span className="label">냉탕 온도</span>
              <span className="relative">
                <input className="field num pr-10" inputMode="decimal" placeholder="16" value={plungeTemp} onChange={(x) => setPlungeTemp(x.target.value.replace(/[^\d.]/g, ""))} />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] text-muted">°C</span>
              </span>
            </label>
          </div>
          <label className="grid gap-1.5">
            <span className="label">후기</span>
            <textarea className="field" rows={3} maxLength={500} placeholder="외기욕 자리, 붐빔, 물 상태 같은 것" value={memo} onChange={(x) => setMemo(x.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="label">사우나 후 먹은 것</span>
            <input className="field" placeholder="식혜, 라면" value={food} onChange={(x) => setFood(x.target.value)} />
          </label>
        </div>
      </details>

      <div className="grid gap-3">
        <label className="flex min-h-11 items-center justify-between gap-3">
          <span className="text-[15px]">
            피드에 공개 <span className="text-[13px] text-muted">{isPublic ? "다른 사람도 볼 수 있어요" : "나만 봐요"}</span>
          </span>
          <span className="relative inline-flex">
            <input type="checkbox" role="switch" checked={isPublic} onChange={(x) => setPublic(x.target.checked)} className="peer sr-only" />
            <span className="h-[30px] w-[50px] rounded-full bg-fill-2 transition-colors peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink" />
            <span className="absolute top-[3px] left-[3px] size-6 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
          </span>
        </label>

        {error ? (
          <p role="alert" className="text-[14px] font-medium text-heat">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-ink w-full" aria-disabled={!ready} style={ready ? undefined : { opacity: 0.35 }}>
          {e ? "수정 저장" : "기록 저장"}
        </button>
        {!user && !e ? <p className="text-center text-[12px] text-muted">가입 없이 이 기기에 저장돼요</p> : null}
      </div>

      {e ? (
        confirmDelete ? (
          <div className="flex items-center justify-between rounded-xl bg-heat-soft px-4 py-3">
            <span className="text-[14px]">이 기록을 지울까요?</span>
            <span className="flex gap-1.5">
              <button type="button" className="chip bg-surface" onClick={() => setConfirmDelete(false)}>
                취소
              </button>
              <button
                type="button"
                className="chip bg-heat text-white"
                onClick={() => {
                  deleteRecord(e.id);
                  router.push("/me");
                }}
              >
                지우기
              </button>
            </span>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 justify-self-center text-[14px] text-muted hover:text-heat">
            <Trash2 className="size-4" aria-hidden /> 기록 지우기
          </button>
        )
      ) : null}
    </form>
  );
}
