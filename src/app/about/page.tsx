import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "데이터와 한계" };

export default function AboutPage() {
  return (
    <div className="page-wrap max-w-2xl py-12">
      <p className="kicker">About</p>
      <h1 className="mt-3 font-serif text-4xl">사우나고싶다란?</h1>
      <p className="mt-6 text-[16px] leading-8 text-[var(--ink-soft)]">
        일본 사우나이키타이의 찾기·가고싶어요·사활 구조를, 한국 목욕장업 인허가 목록 위에 올린 커뮤니티입니다.
      </p>
      <ul className="mt-8 space-y-4 text-[15px] leading-7 text-[var(--ink-soft)]">
        <li>
          <strong className="text-[var(--ink)]">원천</strong> — 행정안전부 LOCALDATA 목욕장업(영업중) 전국 CSV. 시군구·시도 ALL이 400이어도 전국 파일에 광주·전남·인천이 들어 있습니다. 지자체 CSV는 전화 등 보조입니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">확실한 것</strong> — 상호, 주소, 업종, (있으면) 전화와 좌표.
        </li>
        <li>
          <strong className="text-[var(--ink)]">비운 것</strong> — 온도, 요금, 영업시간, 남녀 구분, 업소 사진은 인허가에 없어서 표시하지 않습니다. 사활 중앙값이 생기면 온도만 올립니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">대표 시드</strong> — 홈에 나오는 유명 탕 몇 곳은 편집 데모입니다. 사활이 쌓이면 그 온도가 이깁니다.
        </li>
      </ul>
      <p className="mt-8 text-sm text-[var(--muted)]">
        광주·전남·인천 구멍은 LOCALDATA 전국 CSV(`file/download/public_baths/info`, orgCode 없음)로 메웠습니다. 시군구·시도 ALL(629/646)은 여전히 400입니다. 로그인·검수는 데모이며 운영자 권한이 분리되어 있지 않습니다.
      </p>
      <Link href="/search" className="btn-primary btn mt-6">
        사우나 찾으러 가기
      </Link>
    </div>
  );
}
