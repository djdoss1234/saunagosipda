"use client";

import { fmtStay, lockerStay } from "@/harness/records";
import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const LOCKER_KEY = "saunagosipda.locker";
export const LOCKER_HANDOFF_KEY = "saunagosipda.locker.result";

export function readLocker(): number | null {
  try {
    const v = JSON.parse(localStorage.getItem(LOCKER_KEY) ?? "null") as { inAt?: number } | null;
    return typeof v?.inAt === "number" ? v.inAt : null;
  } catch {
    return null;
  }
}

function writeLocker(inAt: number | null) {
  try {
    if (inAt === null) localStorage.removeItem(LOCKER_KEY);
    else localStorage.setItem(LOCKER_KEY, JSON.stringify({ inAt }));
  } catch {
    // 무시
  }
}

const hhmm = (t: number) => new Date(t).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });

/**
 * /live — 사물함 타이머. 폰은 사우나에 못 들고 가니까 입장·퇴장 두 번만 누른다.
 * 잰 값은 '머문 시간'(샤워·탕 포함)이지 사우나 시간이 아니다. 세트 수·토토노이는 나와서 기억으로.
 */
export function LockerTimer() {
  const router = useRouter();
  const [inAt, setInAt] = useState<number | null | undefined>(undefined);
  const [now, setNow] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);

  useEffect(() => {
    // localStorage에서 한 번 복원(새로고침·다음 날 열어도 이어짐)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInAt(readLocker());
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  if (inAt === undefined) return null;
  const min = inAt ? Math.max(0, Math.floor((now - inAt) / 60000)) : 0;

  function enter() {
    const t = Date.now();
    writeLocker(t);
    setInAt(t);
    setNow(t);
  }

  function leave() {
    const stay = inAt ? lockerStay(inAt, Date.now()) : null;
    writeLocker(null);
    try {
      if (stay) sessionStorage.setItem(LOCKER_HANDOFF_KEY, JSON.stringify(stay));
    } catch {
      // 무시
    }
    router.push(stay ? "/new?from=locker" : "/");
  }

  function quit() {
    writeLocker(null);
    router.push("/");
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <button type="button" onClick={() => (inAt ? setConfirmQuit(true) : router.push("/"))} className="flex size-11 items-center justify-center rounded-full bg-fill" aria-label="닫기">
          <X className="size-5" strokeWidth={1.9} aria-hidden />
        </button>
        <p className="text-[14px] font-medium text-muted">{inAt ? "입장 중" : "사물함 타이머"}</p>
        <span className="size-11" />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        {inAt ? (
          <>
            <p className="num text-[15px] text-muted">{hhmm(inAt)} 입장</p>
            <p className="num mt-2 text-[18vw] leading-none font-bold tracking-[-0.04em] sm:text-7xl" aria-live="off">
              {fmtStay(Math.max(1, min))}
            </p>
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-ink-soft">
              다 끝나고 사물함에서 폰을 꺼내면 퇴장을 눌러요. 세트 수와 토토노이만 고르면 끝이에요.
            </p>
          </>
        ) : (
          <>
            <p className="text-[24px] font-bold">사물함에 넣기 전에</p>
            <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-ink-soft">
              입장을 누르고 폰은 사물함에. 나와서 퇴장을 누르면 머문 시간이 남아요.
            </p>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted">샤워·탕 시간이 들어가서 사우나 시간과는 달라요. 세트별 시간은 평소 루틴으로 채워요.</p>
          </>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-md gap-2">
        {confirmQuit ? (
          <div className="flex items-center justify-between rounded-xl bg-fill px-4 py-3">
            <span className="text-[14px]">기록하지 않고 그만둘까요?</span>
            <span className="flex gap-1.5">
              <button type="button" className="chip bg-surface" onClick={() => setConfirmQuit(false)}>
                계속
              </button>
              <button type="button" className="chip bg-heat text-white" onClick={quit}>
                그만두기
              </button>
            </span>
          </div>
        ) : null}
        <button type="button" onClick={inAt ? leave : enter} className="btn-ink min-h-20 rounded-2xl text-[20px] font-bold">
          {inAt ? "퇴장하고 기록하기" : "입장"}
        </button>
        {!inAt ? (
          <Link href="/live?mode=phases" className="flex min-h-11 items-center justify-center gap-0.5 text-[13px] text-muted">
            폰을 들고 다닐 수 있으면 · 단계별로 재기
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
