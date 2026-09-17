import { isLicensedId, tempsKnown } from "@/data/places";
import { plungeBand, saunaBand, TOTONOI_GUIDE, totonoiScore } from "@/lib/totonoi";
import type { Facility } from "@/lib/types";

export function TotonoiCard({ facility }: { facility: Facility }) {
  const t = facility.totonoi;
  const known = tempsKnown(facility);
  const hot = known ? Math.max(...facility.saunas.map((s) => s.tempC)) : 0;
  const cold = known ? Math.min(...facility.plunges.map((s) => s.tempC)) : 0;

  if (isLicensedId(facility.id) && !t) {
    const score = known ? totonoiScore(facility) : 0;
    return (
      <section className="panel mt-10 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">토토노이 루프</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {known
                ? `사활 중앙값 사우나 ${hot}°C · 냉탕 ${cold}°C. 외기욕·동선은 아직 없습니다.`
                : "인허가 원천에는 온도·냉탕·외기욕 정보가 없습니다. 다녀온 뒤 사활로 채워 주세요."}
            </p>
          </div>
          {known ? <p className="font-serif text-3xl text-[var(--ember-deep)]">{score}</p> : null}
        </div>
      </section>
    );
  }

  if (!t) return null;
  const score = totonoiScore(facility);
  const rows = [
    { label: "사우나 온도", value: known ? `${hot}°C · ${saunaBand(hot, t.humidity).label}` : "인허가에 없음" },
    { label: "냉탕 온도", value: known ? `${cold}°C · ${plungeBand(cold).label}` : "인허가에 없음" },
    { label: "냉탕 수심", value: t.plungeDepth },
    { label: "외기욕", value: t.outdoorRest },
    { label: "루프 동선", value: t.loop },
    { label: "습도", value: t.humidity },
    { label: "누울 자리", value: t.restLieDown ? "있음" : "좌식 위주" },
    { label: "사우나 TV", value: t.tvInSauna ? "있음" : "없음" },
    { label: "풍경", value: t.natureView ? "자연·전망" : "실내 중심" },
  ];

  return (
    <section className="panel mt-10 p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl">토토노이 루프</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            사우나 → 냉탕 → 외기욕 × {TOTONOI_GUIDE.sets}세트. 냉탕 {TOTONOI_GUIDE.plungeTemp.min}–{TOTONOI_GUIDE.plungeTemp.max}°C,
            외기욕 {TOTONOI_GUIDE.restMinutes.min}–{TOTONOI_GUIDE.restMinutes.max}분 기준의 시설 적합도입니다. 건강 상담이 아닙니다.
          </p>
        </div>
        <p className="font-serif text-3xl text-[var(--ember-deep)]">{score}</p>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl bg-[var(--cream-2)] px-3 py-2">
            <dt className="text-xs text-[var(--muted)]">{row.label}</dt>
            <dd className="text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
