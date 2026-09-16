import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "사우나고싶다란?" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-4xl">사우나고싶다란?</h1>
      <p className="mt-6 text-[16px] leading-8 text-[var(--ink-soft)]">
        일본의 사우나이키타이(サウナイキタイ)는 시설 검색, ‘이키타이’ 저장, 사활(방문 기록)이 한 몸으로 움직이는 커뮤니티입니다. 사우나고싶다는 그 구조를 한국의 찜질방·온천·호텔스파 문법으로 옮긴 사이트입니다.
      </p>
      <ul className="mt-8 space-y-4 text-[15px] leading-7 text-[var(--ink-soft)]">
        <li>
          <strong className="text-[var(--ink)]">찾고</strong> — 지역, 유형, 24시간, 냉탕 온도, 노천·수면실 같은 매니악 조건으로 좁힙니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">가고싶어요</strong> — 이키타이 수에 해당하는 기대 지수. 아직 안 가본 탕을 저장합니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">사활</strong> — 다녀온 날의 온도와 먹은 것, 세트 리듬을 남깁니다. 별점보다 장면이 중요합니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">혼잡 경향</strong> — 요일·시간대별 체감으로, 붐비지 않는 슬롯을 고릅니다.
        </li>
      </ul>
      <p className="mt-8 text-sm text-[var(--muted)]">
        현재 버전은 전국 주요 시설 샘플과 브라우저에 저장되는 리뷰로 동작하는 커뮤니티 프로토타입입니다.
      </p>
      <Link href="/search" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[var(--ember)] px-5 text-sm font-semibold text-white">
        사우나 찾으러 가기
      </Link>
    </div>
  );
}
