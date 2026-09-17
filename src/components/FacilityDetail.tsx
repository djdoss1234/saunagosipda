import { ClientVisitList } from "@/components/ClientVisitList";
import { FacilityCover, TempPills } from "@/components/FacilityCard";
import { TotonoiCard } from "@/components/TotonoiCard";
import { WantButton } from "@/components/WantButton";
import { isLicensedId } from "@/data/places";
import { regions } from "@/data/regions";
import { formatCount, formatGender, formatWon, telHref } from "@/lib/format";
import type { Facility } from "@/lib/types";
import Link from "next/link";

export function FacilityDetail({ facility, related }: { facility: Facility; related: Facility[] }) {
  const region = regions.find((r) => r.id === facility.regionId);
  const phoneLink = telHref(facility.phone);
  const licensed = isLicensedId(facility.id);
  const price = formatWon(facility.priceFrom);
  const hoursUnknown = facility.hours === "영업시간 미확인";
  const genderUnknown = facility.genderPolicy === "미확인";
  const rooms = [...facility.saunas, ...facility.plunges];

  return (
    <article className="pb-16">
      <div className="relative h-[42vw] min-h-56 max-h-96">
        <FacilityCover facility={facility} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/80 via-[var(--ink)]/20 to-transparent" />
        <div className="page-wrap absolute bottom-0 left-0 right-0 pb-8 text-white">
          <p className="text-sm text-white/80">
            {facility.type} · {region?.name} {facility.district}
          </p>
          <h1 className="mt-1 font-serif text-4xl">{facility.name}</h1>
        </div>
      </div>

      <div className="page-wrap">
        <nav className="py-4 text-sm text-[var(--muted)]" aria-label="경로">
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
            </div>

            {!licensed && facility.tags.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {facility.tags.map((t) => (
                  <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="chip min-h-9 py-0 text-xs">
                    {t}
                  </Link>
                ))}
              </div>
            ) : null}

            <TotonoiCard facility={facility} />

            {rooms.length ? (
              <section className="mt-10">
                <h2 className="font-serif text-2xl">설비</h2>
                <div className="mt-4 overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
                  <table className="w-full min-w-[28rem] text-sm">
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
                          <td className="px-4 py-3 font-semibold text-[var(--ember-deep)]">{s.tempC > 0 ? `${s.tempC}°C` : "미확인"}</td>
                          <td className="px-4 py-3">{s.gender}</td>
                        </tr>
                      ))}
                      {facility.plunges.map((s) => (
                        <tr key={`p-${s.name}-${s.gender}`} className="border-t border-[var(--border)]">
                          <td className="px-4 py-3">냉탕</td>
                          <td className="px-4 py-3">{s.name}</td>
                          <td className="px-4 py-3 font-semibold text-[var(--moss)]">{s.tempC > 0 ? `${s.tempC}°C` : "미확인"}</td>
                          <td className="px-4 py-3">{s.gender}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {facility.amenities.length ? (
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
            ) : null}

            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">방문 기록</h2>
                <Link href={`/saunas/${facility.id}/review`} className="btn-ink btn">
                  기록 남기기
                </Link>
              </div>
              <ClientVisitList facilityId={facility.id} />
            </section>

            {related.length > 0 ? (
              <section className="mt-10">
                <h2 className="font-serif text-2xl">같은 지역</h2>
                <ul className="mt-4 space-y-2">
                  {related.map((f) => (
                    <li key={f.id}>
                      <Link href={`/saunas/${f.id}`} className="text-sm hover:text-[var(--ember-deep)]">
                        {f.name} · {f.district}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="panel h-fit p-5 lg:sticky lg:top-24">
            <dl className="space-y-3 text-sm">
              {price !== "요금 미확인" ? (
                <div>
                  <dt className="text-[var(--muted)]">입장료</dt>
                  <dd className="font-semibold">{price}</dd>
                </div>
              ) : null}
              {hoursUnknown ? null : (
                <div>
                  <dt className="text-[var(--muted)]">영업</dt>
                  <dd>{facility.hours}</dd>
                </div>
              )}
              {genderUnknown ? null : (
                <div>
                  <dt className="text-[var(--muted)]">입장</dt>
                  <dd>{formatGender(facility.genderPolicy)}</dd>
                </div>
              )}
              <div>
                <dt className="text-[var(--muted)]">주소</dt>
                <dd>{facility.address}</dd>
              </div>
              {phoneLink ? (
                <div>
                  <dt className="text-[var(--muted)]">전화</dt>
                  <dd>
                    <a href={phoneLink} className="hover:text-[var(--ember-deep)]">
                      {facility.phone}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              <WantButton facilityId={facility.id} baseCount={facility.wantCount} />
              {facility.visitCount > 0 ? <p className="text-xs text-[var(--muted)]">방문 {formatCount(facility.visitCount)}</p> : null}
            </div>
            <a
              className="mt-4 inline-flex min-h-11 items-center text-sm text-[var(--ember-deep)]"
              href={`https://map.kakao.com/link/search/${encodeURIComponent(facility.address)}`}
              target="_blank"
              rel="noreferrer"
            >
              카카오맵
            </a>
          </aside>
        </div>
      </div>
    </article>
  );
}
