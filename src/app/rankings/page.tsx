import { RankingsLists } from "@/components/RankingsLists";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "랭킹" };

export default function RankingsPage() {
  return (
    <div className="page-wrap py-10">
      <p className="kicker">Rankings</p>
      <h1 className="mt-2 font-serif text-3xl">랭킹</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        가고싶어요·사활 숫자는 대표 시드가 큽니다. 인허가 목록은 아직 0에서 시작합니다.
      </p>
      <RankingsLists />
    </div>
  );
}
