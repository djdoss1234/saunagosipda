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
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[#1a1410] text-white">
        <div className="hero-steam absolute inset-0" />
        <div className="hero-grain absolute inset-0" />
        <div className="page-wrap relative py-16 sm:py-24">
          <p className="kicker text-[var(--ember-soft)]">SAUNAGOSIPDA</p>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-[1.15] text-white sm:text-6xl">
            가고 싶은 탕이
            <br />
            전국에 있다
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/78">
            인허가로 상호와 자리를 확인하고, 온도는 사활이 쌓일 때만 올립니다. 없는 숫자는 만들지 않습니다.
          </p>
          <div className="mt-8 max-w-xl">
            <SearchBox autoFocus tone="hero" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {quick.map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className="inline-flex min-h-11 items-center rounded-full bg-white/12 px-3 text-sm text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                {chip.label}
              </Link>
            ))}
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-4 text-white">
            <div>
              <dt className="text-[11px] tracking-[0.14em] uppercase text-white/60">인허가 영업중</dt>
              <dd className="font-serif text-3xl tracking-tight">{formatCount(licensed.length)}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.14em] uppercase text-white/60">좌표 확인</dt>
              <dd className="font-serif text-3xl tracking-tight">{formatCount(withCoords)}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.14em] uppercase text-white/60">대표 시드</dt>
              <dd className="font-serif text-3xl tracking-tight">{featured.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="page-wrap grid gap-8 py-10 sm:grid-cols-3">
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            <strong className="block font-serif text-xl text-[var(--ink)]">원천</strong>
            행정안전부 목욕장업 영업중 목록. 상호·주소·좌표만 가져옵니다.
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            <strong className="block font-serif text-xl text-[var(--ink)]">비운 것</strong>
            온도·요금·영업시간·사진은 인허가에 없으면 비웁니다. 재고 사진은 쓰지 않습니다.
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            <strong className="block font-serif text-xl text-[var(--ink)]">채우는 것</strong>
            사활 중앙값이 생기면 그 온도가 카드와 점수에 올라갑니다.
          </p>
        </div>
        <div className="page-wrap pb-10">
          <p className="max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--cream)] px-4 py-3 text-sm leading-relaxed text-[var(--ink-soft)]">
            LOCALDATA 전국 목록 기준입니다. 시군구 파일이 400인 곳도 전국 CSV에 들어 있습니다. 온도·요금·영업시간은 인허가에 없어 비웁니다.{" "}
            <Link href="/about" className="font-medium text-[var(--ember-deep)]">
              데이터와 한계
            </Link>
          </p>
        </div>
      </section>

      <div className="page-wrap grid gap-12 py-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="kicker">Visits</p>
                <h2 className="mt-2 font-serif text-2xl">새 사활</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">편집 시드 방문 기록입니다. 로그인한 사활이 위에 쌓입니다.</p>
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
                <h2 className="mt-2 font-serif text-2xl">지금 주목하는 탕</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">온도·요금이 있는 대표 시드. 인허가 전체는 검색에서.</p>
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
            <p className="mt-1 text-xs text-[var(--muted)]">대표 시설의 시드 수치입니다.</p>
            <ol className="mt-4 space-y-3">
              {ranked.map((f, i) => (
                <li key={f.id}>
                  <Link href={`/saunas/${f.id}`} className="flex gap-3 rounded-xl p-1 transition hover:bg-[var(--cream-2)]">
                    <span className="w-6 font-serif text-lg text-[var(--ember)]">{i + 1}</span>
                    <span>
                      <span className="block text-sm font-medium">{f.name}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {formatCount(f.wantCount)} · 사활 {formatCount(f.visitCount)}
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
