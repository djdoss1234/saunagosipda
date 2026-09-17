import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--ink)] text-[var(--cream)]">
      <div className="page-wrap grid gap-10 py-14 sm:grid-cols-3">
        <div>
          <p className="font-serif text-2xl">사우나고싶다</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--cream)]/72">
            한국의 찜질방·온천·사우나를 인허가 원천으로 찾고, 다녀온 온도는 사활로만 채웁니다.
          </p>
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-[var(--cream)]/45">
            인허가에 없는 온도·요금·시간은 비웁니다. 로그인·검수는 데모입니다.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">둘러보기</p>
          <ul className="mt-3 space-y-2 text-[var(--cream)]/75">
            <li>
              <Link href="/about" className="hover:text-white">
                데이터와 한계
              </Link>
            </li>
            <li>
              <Link href="/search" className="hover:text-white">
                시설 검색
              </Link>
            </li>
            <li>
              <Link href="/map" className="hover:text-white">
                토토노이 지도
              </Link>
            </li>
            <li>
              <Link href="/submit" className="hover:text-white">
                시설 제보
              </Link>
            </li>
            <li>
              <Link href="/queue" className="hover:text-white">
                검수 큐
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">원천</p>
          <p className="mt-3 leading-relaxed text-[var(--cream)]/70">
            상호·주소는 행정안전부 목욕장업(영업중)과 지자체 공중위생 CSV입니다. 인허가에 없는 사진·온도·요금은 비웁니다. 대표 몇 곳의 온도는 편집 시드이며, 사활이 있으면 사활이 이깁니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
