import { FacilityCard } from "@/components/FacilityCard";
import { SearchBox } from "@/components/SearchBox";
import { VisitCard } from "@/components/VisitCard";
import { articles } from "@/data/articles";
import { facilities } from "@/data/facilities";
import { regions } from "@/data/regions";
import { seedVisits } from "@/data/visits";
import { formatCount } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const ranked = [...facilities].sort((a, b) => b.wantCount - a.wantCount).slice(0, 5);
  const featured = facilities.filter((f) => f.featured);
  const latest = seedVisits.slice(0, 4);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=80"
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,22,18,0.55),rgba(28,22,18,0.72))]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-sm font-medium tracking-wide text-[var(--ember-soft)]">한국 사우나 탐방 커뮤니티</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-white sm:text-5xl">
            가고 싶은 사우나가
            <br />
            바로 여기 있다
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/80">
            시설명·지역·온도로 찾고, 가고싶어요로 저장하고, 사활로 남기세요. 이키타이의 리듬을 한국의 탕에 맞췄습니다.
          </p>
          <div className="mt-8 max-w-xl">
            <SearchBox autoFocus />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {["서울", "24시간", "깊은냉탕", "온천수", "오션뷰"].map((chip) => (
              <Link
                key={chip}
                href={`/search?q=${encodeURIComponent(chip)}`}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-white/20"
              >
                {chip}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl">새 사활</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">오늘 다녀온 온기의 기록</p>
              </div>
              <Link href="/visits" className="text-sm font-medium text-[var(--ember-deep)]">
                더 보기
              </Link>
            </div>
            <div className="mt-6 grid gap-6">
              {latest.map((v) => (
                <VisitCard key={v.id} visit={v} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between">
              <h2 className="font-serif text-2xl">지금 주목하는 탕</h2>
              <Link href="/search" className="text-sm font-medium text-[var(--ember-deep)]">
                전체 검색
              </Link>
            </div>
            <div className="mt-6 grid gap-4">
              {featured.map((f) => (
                <FacilityCard key={f.id} facility={f} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">가고싶어요 랭킹</h2>
              <Link href="/rankings" className="text-xs font-medium text-[var(--ember-deep)]">
                전체
              </Link>
            </div>
            <ol className="mt-4 space-y-3">
              {ranked.map((f, i) => (
                <li key={f.id}>
                  <Link href={`/saunas/${f.id}`} className="flex gap-3 rounded-xl p-1 hover:bg-[var(--cream-2)]">
                    <span className="w-6 font-serif text-lg text-[var(--ember)]">{i + 1}</span>
                    <span>
                      <span className="block text-sm font-medium">{f.name}</span>
                      <span className="text-xs text-[var(--muted)]">{formatCount(f.wantCount)} · 사활 {formatCount(f.visitCount)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="font-serif text-xl">지역으로 찾기</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {regions.map((r) => (
                <Link
                  key={r.id}
                  href={`/search?region=${r.id}`}
                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm hover:border-[var(--ember)] hover:text-[var(--ember-deep)]"
                >
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
                    <p className="mt-1 text-xs text-[var(--muted)]">{a.date} · {a.minutes}분</p>
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
