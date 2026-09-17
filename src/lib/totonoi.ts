import type { Facility, TotonoiProfile } from "@/lib/types";

/** 가토 용숭 『医者が教える 究極にととのう サウナ大全』의 시설 비교용 루브릭.
 *  의학 조언을 대체하지 않으며, 온도는 체감·시설 표기의 안내 값이다. */
export const TOTONOI_GUIDE = {
  saunaTemp: { min: 80, max: 100, note: "건식 80–100°C. 습식·로우류는 70–80°C로도 충분" },
  plungeTemp: { min: 16, max: 18, note: "책의 베스트 냉탕 16–18°C. 너무 낮으면 부담, 너무 높으면 토토노이가 약해짐" },
  plungeMinutes: { max: 1, note: "냉탕은 길게 잡아도 1분" },
  restMinutes: { min: 5, max: 10, note: "외기욕은 누워서 5–10분, 처음 2분이 핵심" },
  sets: 3,
} as const;

export function plungeBand(tempC: number) {
  if (tempC < 14) return { label: "극냉", tone: "deep" as const, fit: "숙련" };
  if (tempC < 16) return { label: "조금 참", tone: "ok" as const, fit: "14–15°C" };
  if (tempC <= 18) return { label: "토토노이 존", tone: "good" as const, fit: "16–18°C 권장대" };
  if (tempC <= 22) return { label: "미지근", tone: "ok" as const, fit: "입문" };
  return { label: "풀 냉각", tone: "soft" as const, fit: "풀·스파형" };
}

export function saunaBand(tempC: number, humidity: TotonoiProfile["humidity"]) {
  if (humidity !== "건식" && tempC <= 85) return { label: "습식 적정", tone: "good" as const };
  if (tempC < 80) return { label: "저온", tone: "ok" as const };
  if (tempC <= 100) return { label: "건식 적정", tone: "good" as const };
  return { label: "초고온", tone: "deep" as const };
}

export function totonoiScore(facility: Facility) {
  const hot = Math.max(0, ...facility.saunas.map((s) => s.tempC));
  const cold = Math.min(...facility.plunges.map((s) => s.tempC), 99);
  const temps = hot > 0 && cold > 0 && cold < 90;
  const t = facility.totonoi;
  if (!t) {
    if (!temps) return 0;
    let score = 40;
    const plunge = plungeBand(cold);
    if (plunge.tone === "good") score += 18;
    else if (plunge.tone === "ok") score += 8;
    else if (plunge.tone === "deep") score += 10;
    const sauna = saunaBand(hot, "건식");
    if (sauna.tone === "good") score += 12;
    return Math.min(100, score);
  }
  let score = temps ? 40 : 20;
  if (temps) {
    const plunge = plungeBand(cold);
    if (plunge.tone === "good") score += 18;
    else if (plunge.tone === "ok") score += 8;
    else if (plunge.tone === "deep") score += 10;
    const sauna = saunaBand(hot, t.humidity);
    if (sauna.tone === "good") score += 12;
  }
  if (t.outdoorRest === "우수") score += 16;
  else if (t.outdoorRest === "있음") score += 10;
  else if (t.outdoorRest === "내기욕만") score += 4;
  if (t.loop === "좋음") score += 8;
  else if (t.loop === "보통") score += 4;
  if (t.restLieDown) score += 4;
  if (t.natureView) score += 4;
  if (!t.tvInSauna) score += 3;
  if (t.humidity !== "건식") score += 3;
  if (t.plungeDepth === "깊음") score += 3;
  return Math.min(100, score);
}
