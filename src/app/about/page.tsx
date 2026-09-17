import { CatalogStatus } from "@/components/CatalogStatus";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "데이터" };

export default function AboutPage() {
  return (
    <div className="page-wrap max-w-xl py-12">
      <h1 className="font-serif text-4xl">데이터</h1>
      <p className="mt-6 leading-7 text-[var(--ink-soft)]">
        상호와 주소는 행정안전부 목욕장업(영업중)입니다. 요금·영업시간·사진은 원천에 없어서 비웁니다. 온도는 방문 기록의 중앙값만 올립니다.
      </p>
      <div className="mt-8">
        <CatalogStatus />
      </div>
      <Link href="/search" className="btn-primary btn mt-8">
        검색
      </Link>
    </div>
  );
}
