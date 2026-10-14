"use client";

import { TIMER_HANDOFF_KEY } from "@/components/RecordForm";
import { advance, currentPhase, fmtClock, goldenRemaining, GUIDE, marksToSets, PHASE_LABEL, undo, type Phase, type TimerState } from "@/harness/records";
import { RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "saunagosipda.live";

const TONE: Record<Phase, { bg: string; text: string }> = {
  sauna: { bg: "bg-heat", text: "text-heat" },
  plunge: { bg: "bg-cold", text: "text-cold" },
  rest: { bg: "bg-rest", text: "text-rest" },
};

const NEXT_LABEL: Record<Phase, string> = { sauna: "냉탕 들어가기", plunge: "외기욕 시작", rest: "다음 세트 사우나" };

function hint(phase: Phase, sec: number) {
  if (phase === "sauna")
    return sec > 12 * 60 ? "오래 있었어요. 무리하지 말고 나오세요." : "평소 맥박의 2배쯤이면 나와요 · 보통 6~10분";
  if (phase === "plunge")
    return sec > 150 ? "너무 오래예요. 난간 잡고 천천히 나오세요." : "숨을 내쉬며 천천히 · 맥박이 가라앉으면 나와요(약 1분)";
  return sec > 10 * 60 ? "발끝이 살짝 차가우면 다음 세트" : "누워서 쉬세요 · 5~10분";
}

function readSaved(): TimerState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as TimerState | null;
    return raw && Array.isArray(raw.marks) ? raw : { marks: [] };
  } catch {
    return { marks: [] };
  }
}

/** /live?mode=phases — 단계가 바뀔 때 버튼 한 번. 폰을 들고 다닐 수 있을 때만(방수 파우치 등). 기본은 사물함 타이머. */
export function PhaseTimer() {
  const router = useRouter();
  const [t, setT] = useState<TimerState | null>(null);
  const [now, setNow] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);

  useEffect(() => {
    // 새로고침·화면 꺼짐 뒤에도 이어서: localStorage에서 한 번 복원
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setT(readSaved());
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!t) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(t));
    } catch {
      // 무시
    }
  }, [t]);

  const running = !!t?.marks.length;
  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let lock: { release: () => Promise<void> } | null = null;
    navigator.wakeLock
      .request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [running]);

  const golden = t ? goldenRemaining(t, now) : null;
  useEffect(() => {
    if (golden === 0 && "vibrate" in navigator) navigator.vibrate?.(200);
  }, [golden]);

  if (!t) return null;
  const phase = currentPhase(t);
  const last = t.marks.at(-1);
  const elapsed = last ? Math.max(0, Math.floor((now - last.at) / 1000)) : 0;
  const setNo = t.marks.filter((m) => m.phase === "sauna").length;

  function finish() {
    const done = marksToSets(t!.marks, Date.now());
    try {
      sessionStorage.setItem(TIMER_HANDOFF_KEY, JSON.stringify(done));
      localStorage.removeItem(KEY);
    } catch {
      // 무시
    }
    router.push(done.length ? "/new?from=timer" : "/new");
  }

  function quit() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // 무시
    }
    router.push("/");
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <button
          type="button"
          onClick={() => (running ? setConfirmQuit(true) : quit())}
          className="flex size-11 items-center justify-center rounded-full bg-fill"
          aria-label="닫기"
        >
          <X className="size-5" strokeWidth={1.9} aria-hidden />
        </button>
        <p className="num text-[14px] font-medium text-muted">{running ? `${setNo}세트째` : "준비"}</p>
        <button
          type="button"
          onClick={() => setT(undo(t))}
          disabled={!running}
          className="flex size-11 items-center justify-center rounded-full bg-fill disabled:opacity-30"
          aria-label="방금 누른 것 되돌리기"
        >
          <RotateCcw className="size-5" strokeWidth={1.9} aria-hidden />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        {phase ? (
          <>
            <p className={`text-[22px] font-bold ${TONE[phase].text}`}>{PHASE_LABEL[phase]}</p>
            <p className="num mt-2 text-[24vw] leading-none font-bold tracking-[-0.04em] sm:text-8xl" aria-live="off">
              {fmtClock(elapsed)}
            </p>
            <p className="mt-4 max-w-xs text-[15px] text-ink-soft">{hint(phase, elapsed)}</p>
            {golden !== null ? (
              <div className={`mt-6 rounded-2xl px-5 py-3 ${golden > 0 ? "bg-rest-soft text-rest" : "bg-fill text-muted"}`}>
                <p className="text-[12px] font-semibold">토토노이 골든타임</p>
                <p className="num text-[30px] font-bold">{golden > 0 ? fmtClock(golden) : "지남"}</p>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-[24px] font-bold">단계별로 재기</p>
            <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-ink-soft">
              사우나실에 들어갈 때 시작을 누르고, 단계가 바뀔 때마다 큰 버튼 한 번. 시간은 알아서 재요.
            </p>
            <ol className="mt-6 flex gap-2 text-[14px]">
              <li className="rounded-full bg-heat-soft px-3 py-1 font-semibold text-heat">사우나</li>
              <li className="rounded-full bg-cold-soft px-3 py-1 font-semibold text-cold">냉탕</li>
              <li className="rounded-full bg-rest-soft px-3 py-1 font-semibold text-rest">외기욕</li>
            </ol>
            <p className="mt-3 text-[12px] text-muted">권장: {GUIDE.sets}세트 · 냉탕 약 1분 · 외기욕 5~10분</p>
          </>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-md gap-2">
        {confirmQuit ? (
          <div className="flex items-center justify-between rounded-xl bg-fill px-4 py-3">
            <span className="text-[14px]">기록하지 않고 그만둘까요?</span>
            <span className="flex gap-2">
              <button type="button" className="chip bg-surface" onClick={() => setConfirmQuit(false)}>
                계속
              </button>
              <button type="button" className="chip bg-heat text-white" onClick={quit}>
                그만두기
              </button>
            </span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setT(advance(t, Date.now()));
            setNow(Date.now());
          }}
          className={`flex min-h-20 items-center justify-center rounded-2xl text-[20px] font-bold text-white ${phase ? TONE[{ sauna: "plunge", plunge: "rest", rest: "sauna" }[phase] as Phase].bg : "bg-heat"}`}
        >
          {phase ? NEXT_LABEL[phase] : "사우나 시작"}
        </button>
        {running ? (
          <button type="button" onClick={finish} className="btn-fill w-full">
            끝내고 기록하기
          </button>
        ) : null}
      </div>
    </div>
  );
}
