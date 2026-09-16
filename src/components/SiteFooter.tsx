import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--ink)] text-[var(--cream)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-serif text-2xl">사우나고싶다</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--cream)]/70">
            한국의 찜질방·온천·호텔스파를 한곳에서 찾고, 다녀온 기록을 남기는 탐방 커뮤니티.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">둘러보기</p>
          <ul className="mt-3 space-y-2 text-[var(--cream)]/75">
            <li>
              <Link href="/about" className="hover:text-white">
                사우나고싶다란?
              </Link>
            </li>
            <li>
              <Link href="/search" className="hover:text-white">
                시설 검색
              </Link>
            </li>
            <li>
              <Link href="/visits" className="hover:text-white">
                사활 피드
              </Link>
            </li>
            <li>
              <Link href="/rankings" className="hover:text-white">
                가고싶어요 랭킹
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">안내</p>
          <p className="mt-3 leading-relaxed text-[var(--cream)]/70">
            온도·영업시간·요금은 시설에 따라 달라질 수 있습니다. 방문 전 공식 정보를 확인해 주세요. 데모 데이터로 구성된 커뮤니티 프로토타입입니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
