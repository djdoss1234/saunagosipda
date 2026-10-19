"use client";

import { RecordRow } from "@/components/RecordCard";
import { RecordFormPage } from "@/components/RecordForm";
import { useApp } from "@/context/AppState";
import { readLocker } from "@/components/LockerTimer";
import { byNewest, fmtStay, stats } from "@/harness/records";
import { ChevronRight, DoorOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

/** 홈 = 바로 기록. 아래에 최근 기록 세 줄만. 통계·전체 목록은 마이. */
export function Home() {
  const { ready, records } = useApp();
  const recent = [...records].sort(byNewest).slice(0, 3);
  const s = stats(records);
  const [lockerMin, setLockerMin] = useState<number | null>(null);
  useEffect(() => {
    // 사물함 타이머가 돌고 있으면 맨 위에 '입장 중'. localStorage라 마운트 뒤에 읽는다.
    const inAt = readLocker();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLockerMin(inAt ? Math.max(1, Math.floor((Date.now() - inAt) / 60000)) : null);
  }, []);

  return (
    <div className="grid gap-3">
      {lockerMin ? (
        <Link href="/live" className="press mt-2 flex items-center gap-3 rounded-[22px] bg-ink px-5 py-4 text-on-ink">
          <DoorOpen className="size-5 shrink-0" strokeWidth={1.9} aria-hidden />
          <span className="min-w-0 flex-1 text-[15px] font-semibold">
            입장 중 <span className="num font-normal opacity-70">· {fmtStay(lockerMin)}째</span>
          </span>
          <span className="text-[14px]">퇴장하기</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : null}
      <RecordFormPage home />

      {ready && recent.length ? (
        <>
          <section aria-labelledby="h-recent" className="card grid gap-1 pb-2">
            <div className="flex items-center justify-between">
              <h2 id="h-recent" className="card-title">
                최근 기록
              </h2>
              <Link href="/me" className="flex items-center text-[13px] text-muted">
                이번 달 {s.thisMonth}회 · 전체 {s.total}
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ul>
              {recent.map((rec) => (
                <li key={rec.id} className="border-b border-line last:border-0">
                  <RecordRow r={rec} />
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
