"use client";

import { RecordCard } from "@/components/RecordCard";
import { useApp } from "@/context/AppState";
import Link from "next/link";
import { useState } from "react";

/** 공개된 기록만. 별점·랭킹 없음. 최신순. */
export function Feed() {
  const { feed, feedReady, user } = useApp();
  const [mineOnly, setMineOnly] = useState(false);
  const list = mineOnly && user ? feed.filter((r) => r.userId === user.id) : feed;

  return (
    <div className="grid gap-2 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold">피드</h1>
        {user ? (
          <div className="flex gap-1.5">
            <button type="button" className="chip" aria-pressed={!mineOnly} onClick={() => setMineOnly(false)}>
              전체
            </button>
            <button type="button" className="chip" aria-pressed={mineOnly} onClick={() => setMineOnly(true)}>
              내 기록
            </button>
          </div>
        ) : null}
      </div>
      {!feedReady ? (
        <p className="py-16 text-center text-[14px] text-muted">불러오는 중</p>
      ) : list.length ? (
        <div className="divide-y divide-line">
          {list.map((r) => (
            <RecordCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <div className="grid justify-items-center gap-3 py-16 text-center">
          <p className="text-[16px] font-semibold">아직 공개된 기록이 없어요</p>
          <p className="text-[14px] text-muted">기록을 공개로 저장하면 여기에 올라와요.</p>
          <Link href="/" className="btn-ink mt-2 px-6">
            기록하러 가기
          </Link>
        </div>
      )}
    </div>
  );
}
