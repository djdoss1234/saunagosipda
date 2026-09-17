import { CatalogStatus } from "@/components/CatalogStatus";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "데이터와 한계" };

export default function AboutPage() {
  return (
    <div className="page-wrap max-w-2xl py-12">
      <p className="kicker">About</p>
      <h1 className="mt-3 font-serif text-4xl">사우나고싶다란?</h1>
      <p className="mt-6 text-[16px] leading-8 text-[var(--ink-soft)]">
        일본 사우나이키타이를 참고한 한국 사우나 찾기입니다. 이키타이는 이용자가 시설 정보를 쌓고, 사활(サ活)로 방문만 남기며 별점은 매기지 않습니다.
      </p>
      <ul className="mt-8 space-y-4 text-[15px] leading-7 text-[var(--ink-soft)]">
        <li>
          <strong className="text-[var(--ink)]">다른 점</strong> — 우리는 행정안전부 목욕장업 인허가가 목록의 뼈대입니다. 이키타이처럼 후기만으로 상호를 만들지 않습니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">같은 점</strong> — 가고싶어요(저장), 방문 기록, 온도는 간 사람이 적습니다. 별점 랭킹으로 탕을 줄 세우지 않습니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">루프 점수</strong> — 가토 용숭 기준으로 사우나 80–100°C, 냉탕 16–18°C, 외기욕이 있으면 올라가는 시설 적합도입니다. 이용자 평점이 아닙니다. 온도가 없으면 점수도 없습니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">비운 것</strong> — 요금, 영업시간, 사진은 인허가에 없어서 비웁니다.
        </li>
      </ul>
      <div className="mt-8">
        <CatalogStatus />
      </div>
      <p className="mt-6 text-sm text-[var(--muted)]">
        하루에 한 번 전국 CSV를 다시 읽어 폐업은 내리고 신규 영업은 올립니다. 지금 확인할 수도 있습니다. 문 앞 실시간 영업은 원천이 아니라서 보장하지 않습니다.
      </p>
      <Link href="/search" className="btn-primary btn mt-6">
        사우나 찾으러 가기
      </Link>
    </div>
  );
}
