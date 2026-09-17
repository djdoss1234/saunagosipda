import { RankingsLists } from "@/components/RankingsLists";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "저장순" };

export default function RankingsPage() {
  return (
    <div className="page-wrap py-10">
      <h1 className="font-serif text-3xl">저장순</h1>
      <RankingsLists />
    </div>
  );
}
