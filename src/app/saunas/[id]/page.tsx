import { ClientVisitList } from "@/components/ClientVisitList";
import { CrowdHeatmap } from "@/components/CrowdHeatmap";
import { TempPills } from "@/components/FacilityCard";
import { TotonoiCard } from "@/components/TotonoiCard";
import { WantButton } from "@/components/WantButton";
import { facilities, getFacility } from "@/data/facilities";
import { regions } from "@/data/regions";
import { formatCount, formatWon } from "@/lib/format";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return facilities.map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const f = getFacility(id);
  return { title: f?.name ?? "시설" };
}

export default async function FacilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facility = getFacility(id);
  if (!facility) notFound();
  const region = regions.find((r) => r.id === facility.regionId);
  const related = facilities
    .filter((f) => f.regionId === facility.regionId && f.id !== facility.id)
    .slice(0, 3);

  return (
    <article className="pb-16">
      <div className="relative h-[42vw] min-h-56 max-h-96">
        <Image src={facility.cover} alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 pb-8 text-white">
          <p className="text-sm text-white/80">
            {facility.type} · {region?.name} {facility.district}
          </p>
          <h1 className="mt-1 font-serif text-4xl">{facility.name}</h1>
          <p className="mt-1 text-sm text-white/70">{facility.nameEn}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <nav className="py-4 text-sm text-[var(--muted)]">
          <Link href="/">홈</Link>
          <span className="mx-2">/</span>
          <Link href={`/search?region=${facility.regionId}`}>{region?.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--ink)]">{facility.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <TempPills facility={facility} />
              <span className="text-sm text-[var(--muted)]">평점 {facility.rating.toFixed(1)}</span>
            </div>
            <p className="mt-5 max-w-prose text-[15px] leading-relaxed text-[var(--ink-soft)]">{facility.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {facility.tags.map((t) => (
                <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-full bg-[var(--cream-2)] px-3 py-1 text-xs">
                  {t}
                </Link>
              ))}
            </div>

            <TotonoiCard facility={facility} />

            <section className="mt-10">
              <h2 className="font-serif text-2xl">설비</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--cream-2)] text-left text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">구분</th>
                      <th className="px-4 py-3 font-medium">이름</th>
                      <th className="px-4 py-3 font-medium">온도</th>
                      <th className="px-4 py-3 font-medium">성별</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facility.saunas.map((s) => (
                      <tr key={`s-${s.name}-${s.gender}`} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3">사우나 · {s.type}</td>
                        <td className="px-4 py-3">{s.name}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--ember-deep)]">{s.tempC}°C</td>
                        <td className="px-4 py-3">{s.gender}</td>
                      </tr>
                    ))}
                    {facility.plunges.map((s) => (
                      <tr key={`p-${s.name}-${s.gender}`} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3">냉탕</td>
                        <td className="px-4 py-3">{s.name}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--moss)]">{s.tempC}°C</td>
                        <td className="px-4 py-3">{s.gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-serif text-2xl">편의</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {facility.amenities.map((a) => (
                  <li key={a} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm">
                    {a}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <CrowdHeatmap pattern={facility.crowd} />
            </section>

            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">사활</h2>
                <Link
                  href={`/saunas/${facility.id}/review`}
                  className="inline-flex min-h-11 items-center rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--cream)]"
                >
                  사활 남기기
                </Link>
              </div>
              <ClientVisitList facilityId={facility.id} />
            </section>

            {related.length > 0 && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl">같은 지역의 탕</h2>
                <ul className="mt-4 space-y-2">
                  {related.map((f) => (
                    <li key={f.id}>
                      <Link href={`/saunas/${f.id}`} className="text-sm hover:text-[var(--ember-deep)]">
                        {f.name} · {formatWon(f.priceFrom)}~
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] lg:sticky lg:top-24">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[var(--muted)]">입장료</dt>
                <dd className="font-semibold">{formatWon(facility.priceFrom)}~</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">영업</dt>
                <dd>{facility.hours}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">입장</dt>
                <dd>{facility.genderPolicy}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">주소</dt>
                <dd>{facility.address}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">전화</dt>
                <dd>
                  <a href={`tel:${facility.phone}`} className="hover:text-[var(--ember-deep)]">
                    {facility.phone}
                  </a>
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              <WantButton facilityId={facility.id} baseCount={facility.wantCount} />
              <p className="text-xs text-[var(--muted)]">사활 {formatCount(facility.visitCount)} · 예약 {facility.reservation ? "권장" : "불필요"}</p>
            </div>
            <a
              className="mt-4 inline-flex min-h-11 items-center text-sm text-[var(--ember-deep)]"
              href={`https://map.kakao.com/link/search/${encodeURIComponent(facility.address)}`}
              target="_blank"
              rel="noreferrer"
            >
              지도에서 위치 보기
            </a>
          </aside>
        </div>
      </div>
    </article>
  );
}
