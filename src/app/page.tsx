import { CatalogStatus } from "@/components/CatalogStatus";
import { FacilityCard } from "@/components/FacilityCard";
import { SearchBox } from "@/components/SearchBox";
import { VisitCard } from "@/components/VisitCard";
import { articles } from "@/data/articles";
import { facilities } from "@/data/facilities";
import { hasKoreaCoords, isLicensedId } from "@/data/places";
import { regions } from "@/data/regions";
import { seedVisits } from "@/data/visits";
import { formatCount } from "@/lib/format";
import Link from "next/link";

export default function HomePage() {
  const ranked = [...facilities].sort((a, b) => b.wantCount - a.wantCount).slice(0, 5);
  const featured = facilities.filter((f) => f.featured);
  const latest = seedVisits.slice(0, 4);
  const licensed = facilities.filter((f) => isLicensedId(f.id));
  const withCoords = licensed.filter((f) => hasKoreaCoords(f.lat, f.lng)).length;
  const quick = [
    { href: "/search?region=seoul", label: "서울" },
    { href: "/search?region=busan", label: "부산" },
    { href: "/search?region=incheon", label: "인천" },
    { href: "/search?region=gwangju", label: "광주" },
    { href: "/search?region=gyeonggi", label: "경기" },
    { href: "/search?type=찜질방", label: "찜질방" },
    { href: "/search?type=온천", label: "온천" },
    { href: "/search?type=사우나", label: "사우나" },
  ];

  return (
    <div>
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="page-wrap py-12 sm:py-16">
          <p className="kicker">사우나 검색</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-[1.2] text-[var(--ink)] sm:text-5xl">
            가고 싶은 탕이 전국에 있다
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
            별점 평점은 없습니다. 상호·주소는 목욕장업 인허가, 온도는 다녀온 사람이 남긴 방문 기록만 올립니다.
          </p>
          <div className="mt-8 max-w-xl">
            <SearchBox autoFocus />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {quick.map((chip) => (
              <Link key={chip.href} href={chip.href} className="chip min-h-11 py-0 text-sm">
                {chip.label}
              </Link>
            ))}
          </div>
          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[var(--muted)]">인허가 영업중</dt>
              <dd className="font-serif text-3xl tracking-tight">{formatCount(licensed.length)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">좌표 확인</dt>
              <dd className="font-serif text-3xl tracking-tight">{formatCount(withCoords)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">온도 있는 대표</dt>
              <dd className="font-serif text-3xl tracking-tight">{featured.length}</dd>
            </div>
          </dl>
          <div className="mt-8 max-w-2xl">
            <CatalogStatus />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]">
        <div className="page-wrap grid gap-8 py-10 sm:grid-cols-3">
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            <strong className="block font-serif text-xl text-[var(--ink)]">원천</strong>
            행정안전부 목욕장업. 이키타이가 후기로 시설을 모으는 것과 달리, 여기서는 허가가 먼저입니다.
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            <strong className="block font-serif text-xl text-[var(--ink)]">방문 기록</strong>
            이키타이의 사활(サ活)과 같습니다. 온도·혼잡·한 줄 일기지, 별점이 아닙니다.
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            <strong className="block font-serif text-xl text-[var(--ink)]">비운 것</strong>
            인허가에 없는 요금·영업시간·사진은 만들지 않습니다.
          </p>
        </div>
      </section>

      <div className="page-wrap grid gap-12 py-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="kicker">Visits</p>
                <h2 className="mt-2 font-serif text-2xl">최근 방문</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">다녀온 기록입니다. 로그인하면 여기에 쌓입니다.</p>
              </div>
              <Link href="/visits" className="text-sm font-medium text-[var(--ember-deep)]">
                더 보기
              </Link>
            </div>
            <div className="stagger-in mt-6 grid gap-6">
              {latest.map((v) => (
                <VisitCard key={v.id} visit={v} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between">
              <div>
                <p className="kicker">Featured</p>
                <h2 className="mt-2 font-serif text-2xl">온도가 있는 대표 탕</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">편집 시드입니다. 전국 목록은 검색에서.</p>
              </div>
              <Link href="/search" className="text-sm font-medium text-[var(--ember-deep)]">
                전체 검색
              </Link>
            </div>
            <div className="stagger-in mt-6 grid gap-4">
              {featured.map((f) => (
                <FacilityCard key={f.id} facility={f} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">가고싶어요</h2>
              <Link href="/rankings" className="text-xs font-medium text-[var(--ember-deep)]">
                전체
              </Link>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">저장 횟수입니다. 평점이 아닙니다.</p>
            <ol className="mt-4 space-y-3">
              {ranked.map((f, i) => (
                <li key={f.id}>
                  <Link href={`/saunas/${f.id}`} className="flex gap-3 rounded-xl p-1 transition hover:bg-[var(--cream-2)]">
                    <span className="w-6 font-serif text-lg text-[var(--ember)]">{i + 1}</span>
                    <span>
                      <span className="block text-sm font-medium">{f.name}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {formatCount(f.wantCount)} · 방문 {formatCount(f.visitCount)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel p-5">
            <h2 className="font-serif text-xl">지역으로 찾기</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {regions.map((r) => (
                <Link key={r.id} href={`/search?region=${r.id}`} className="chip min-h-10 py-0">
                  {r.name}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl">매거진</h2>
            <ul className="mt-4 space-y-4">
              {articles.slice(0, 3).map((a) => (
                <li key={a.slug}>
                  <Link href={`/magazine/${a.slug}`} className="block rounded-xl hover:opacity-90">
                    <p className="text-sm font-medium leading-snug">{a.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {a.date} · {a.minutes}분
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
