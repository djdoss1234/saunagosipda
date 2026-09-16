import { RankingsLists } from "@/components/RankingsLists";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "랭킹" };

export default function RankingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl">랭킹</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">가고싶어요는 기대, 사활은 발걸음입니다.</p>
      <RankingsLists />
    </div>
  );
}
