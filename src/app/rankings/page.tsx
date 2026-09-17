import { RankingsLists } from "@/components/RankingsLists";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "저장·방문 순" };

export default function RankingsPage() {
  return (
    <div className="page-wrap py-10">
      <p className="kicker">Lists</p>
      <h1 className="mt-2 font-serif text-3xl">저장·방문 순</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        별점 평점이 아닙니다. 가고싶어요(저장) 횟수와 방문 기록 수입니다. 대표 시드 숫자가 아직 큽니다.
      </p>
      <RankingsLists />
    </div>
  );
}
