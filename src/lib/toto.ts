/**
 * 토토노이 색 = 사우나 한 바퀴의 단계.
 * 1~2 아직 열기(사우나 주황) → 3 식는 중(냉탕 파랑) → 4~5 풀림(외기욕 초록).
 */
const TOTO_COLORS = [
  "var(--heat)",
  "color-mix(in oklab, var(--heat) 55%, #f2a33a)",
  "var(--cold)",
  "color-mix(in oklab, var(--rest) 65%, var(--cold))",
  "var(--rest)",
];

export function totoColor(v: number) {
  return TOTO_COLORS[Math.min(5, Math.max(1, Math.round(v))) - 1];
}
