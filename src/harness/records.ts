import type { RecordSource, SaunaSet, SessionRecord, Totonoi, UserProfile } from "@/lib/types";

/** 『의사가 가르쳐 주는 사우나 교과서』(가토 야스타카) 기준 안내값. 의학 조언이 아니다. */
export const GUIDE = {
  saunaSec: 8 * 60, // 아침 5분, 밤 7분 안팎. 맥박 평상시 2배가 기준 (p.113, 208–210)
  plungeSec: 60, // 하고로모 30초~1분, 맥박이 돌아오면 나온다 (p.125, 133)
  restSec: 7 * 60, // 외기욕 5–10분, 누워서 (p.138–139)
  sets: 3,
  goldenSec: 120, // 아드레날린 반감기 2분 = 토토노이 골든타임 (p.140–144)
} as const;

export const TOTONOI_LABELS: Record<Totonoi, string> = {
  1: "별로",
  2: "그럭저럭",
  3: "좋음",
  4: "아주 좋음",
  5: "완벽",
};

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

export type Clock = { iso: () => string; id: (prefix: string) => string };

export const systemClock: Clock = {
  iso: () => new Date().toISOString(),
  id: (prefix) =>
    `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now().toString(36)}`,
};

export type RecordDraft = Pick<
  SessionRecord,
  "placeId" | "placeName" | "date" | "sets" | "totonoi" | "saunaTempC" | "plungeTempC" | "memo" | "food" | "public" | "source" | "stayMin" | "startedAt"
>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SOURCES: RecordSource[] = ["manual", "locker", "timer", "watch", "legacy"];

export const SOURCE_LABEL: Record<RecordSource, string> = {
  manual: "기억으로 기록",
  locker: "머문 시간 측정",
  timer: "단계별 측정",
  watch: "워치 측정",
  legacy: "이전 기록",
};

/** 세트당 시간이 실제로 잰 값인가. 아니면 루틴으로 채운 추정이다. */
export function setsMeasured(source: RecordSource) {
  return source === "timer" || source === "watch";
}

export type Pace = "short" | "usual" | "long";
export const PACE_LABEL: Record<Pace, string> = { short: "평소보다 짧게", usual: "평소대로", long: "평소보다 길게" };
const PACE_FACTOR: Record<Pace, number> = { short: 0.75, usual: 1, long: 1.25 };

/** "평소보다 길게/짧게" 한 번으로 세트 시간을 늘이고 줄인다. 사우나·외기욕은 30초, 냉탕은 15초 단위. */
export function paceSets(base: SaunaSet[], pace: Pace): SaunaSet[] {
  const f = PACE_FACTOR[pace];
  const r = (sec: number, step: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round((sec * f) / step) * step));
  return base.map((s) => ({
    saunaSec: r(s.saunaSec, 30, 60, 1800),
    plungeSec: s.plungeSec ? r(s.plungeSec, 15, 15, 600) : 0,
    restSec: s.restSec ? r(s.restSec, 30, 30, 1800) : 0,
  }));
}

/** 머문 시간 표기: 100 → "1시간 40분" */
export function fmtStay(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h}시간 ${m}분` : `${h}시간`) : `${m}분`;
}

/** 현지 날짜 YYYY-MM-DD (UTC로 자르면 새벽 기록이 어제로 간다) */
export function localDate(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function inRange(n: number | undefined, min: number, max: number) {
  return n === undefined || (Number.isFinite(n) && n >= min && n <= max);
}

export function validateDraft(draft: RecordDraft, today: string): Result<RecordDraft> {
  const placeName = draft.placeName.trim();
  if (placeName.length < 1) return { ok: false, message: "어디서 했는지 골라 주세요." };
  if (placeName.length > 60) return { ok: false, message: "장소 이름이 너무 길어요." };
  if (!DATE_RE.test(draft.date) || draft.date > today) return { ok: false, message: "날짜를 확인해 주세요." };
  if (draft.sets.length < 1 || draft.sets.length > 10) return { ok: false, message: "세트는 1~10개로 남겨 주세요." };
  for (const s of draft.sets) {
    if (!inRange(s.saunaSec, 30, 30 * 60)) return { ok: false, message: "사우나 시간은 30초~30분이에요." };
    if (!inRange(s.plungeSec, 0, 10 * 60)) return { ok: false, message: "냉탕 시간은 0~10분이에요." };
    if (!inRange(s.restSec, 0, 30 * 60)) return { ok: false, message: "외기욕 시간은 0~30분이에요." };
  }
  if (![1, 2, 3, 4, 5].includes(draft.totonoi)) return { ok: false, message: "토토노이를 골라 주세요." };
  if (!inRange(draft.saunaTempC, 40, 130)) return { ok: false, message: "사우나 온도는 40~130°C예요." };
  if (!inRange(draft.plungeTempC, 1, 30)) return { ok: false, message: "냉탕 온도는 1~30°C예요." };
  if ((draft.memo ?? "").length > 500) return { ok: false, message: "메모는 500자까지예요." };
  if (!SOURCES.includes(draft.source)) return { ok: false, message: "기록 방식이 맞지 않아요." };
  if (!inRange(draft.stayMin, 1, 12 * 60)) return { ok: false, message: "머문 시간은 1분~12시간이에요." };
  if (draft.startedAt !== undefined && Number.isNaN(Date.parse(draft.startedAt))) return { ok: false, message: "입장 시각이 맞지 않아요." };
  return {
    ok: true,
    value: {
      ...draft,
      placeName,
      memo: draft.memo?.trim() || undefined,
      food: draft.food?.trim() || undefined,
    },
  };
}

export function createRecord(
  draft: RecordDraft,
  user: UserProfile,
  clock: Clock = systemClock,
  today = localDate(),
): Result<SessionRecord> {
  const v = validateDraft(draft, today);
  if (!v.ok) return v;
  return {
    ok: true,
    value: {
      ...v.value,
      id: clock.id("rec"),
      userId: user.id,
      userName: user.name,
      createdAt: clock.iso(),
      likes: 0,
      synced: false,
    },
  };
}

export function median(values: number[]) {
  const xs = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

const round30 = (s: number) => Math.max(0, Math.round(s / 30) * 30);

/** 내 기록의 중앙값 세트. 기록이 없으면 null. */
export function routine(records: SessionRecord[]): (SaunaSet & { sets: number }) | null {
  const sets = records.flatMap((r) => r.sets);
  if (!sets.length) return null;
  const counts = records.filter((r) => r.sets.length).map((r) => r.sets.length);
  return {
    saunaSec: round30(median(sets.map((s) => s.saunaSec))!),
    plungeSec: round30(median(sets.map((s) => s.plungeSec))!),
    restSec: round30(median(sets.map((s) => s.restSec))!),
    sets: Math.round(median(counts) ?? GUIDE.sets),
  };
}

/** 빠른 기록의 기본값: 내 루틴, 없으면 책 기준 3세트. */
export function defaultSets(records: SessionRecord[]): SaunaSet[] {
  const r = routine(records);
  const one: SaunaSet = r
    ? { saunaSec: r.saunaSec, plungeSec: r.plungeSec, restSec: r.restSec }
    : { saunaSec: GUIDE.saunaSec, plungeSec: GUIDE.plungeSec, restSec: GUIDE.restSec };
  return Array.from({ length: r?.sets ?? GUIDE.sets }, () => ({ ...one }));
}

/** 최근에 간 곳 (이름 기준 중복 제거, 최신순) */
export function recentPlaces(records: SessionRecord[], limit = 5) {
  const seen = new Set<string>();
  const out: { placeId?: string; placeName: string }[] = [];
  for (const r of [...records].sort(byNewest)) {
    const key = r.placeId ?? r.placeName;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ placeId: r.placeId, placeName: r.placeName });
    if (out.length >= limit) break;
  }
  return out;
}

export function byNewest(a: SessionRecord, b: SessionRecord) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

function weekIndex(date: string) {
  // 월요일 시작 주 번호 (UTC 자정 기준 날짜 산술이라 DST 영향 없음)
  const t = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
  return Math.floor((t / 86400000 + 3) / 7);
}

export function stats(records: SessionRecord[], today = localDate()) {
  const sets = records.flatMap((r) => r.sets);
  const month = today.slice(0, 7);
  const weeks = new Set(records.map((r) => weekIndex(r.date)));
  let w = weekIndex(today);
  if (!weeks.has(w)) w -= 1; // 이번 주에 아직 안 갔어도 지난주까지 이어졌으면 연속으로 본다
  let streakWeeks = 0;
  while (weeks.has(w)) {
    streakWeeks += 1;
    w -= 1;
  }
  const byPlace = new Map<string, { placeId?: string; placeName: string; count: number }>();
  for (const r of records) {
    const key = r.placeId ?? r.placeName;
    const cur = byPlace.get(key) ?? { placeId: r.placeId, placeName: r.placeName, count: 0 };
    cur.count += 1;
    byPlace.set(key, cur);
  }
  const months: { month: string; count: number }[] = [];
  const [y, m] = [+today.slice(0, 4), +today.slice(5, 7)];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push({ month: key, count: records.filter((r) => r.date.startsWith(key)).length });
  }
  const rated = records.map((r) => r.totonoi);
  return {
    total: records.length,
    totalSets: sets.length,
    saunaMinutes: Math.round(sets.reduce((a, s) => a + s.saunaSec, 0) / 60),
    thisMonth: records.filter((r) => r.date.startsWith(month)).length,
    streakWeeks,
    avgTotonoi: rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : null,
    topPlaces: [...byPlace.values()].sort((a, b) => b.count - a.count).slice(0, 3),
    months,
  };
}

/** 시설 상세의 "기록 기준" 숫자. 기록이 없으면 null → 화면에서 숨긴다. */
export function placeStats(records: SessionRecord[]) {
  if (!records.length) return null;
  const sauna = median(records.map((r) => r.saunaTempC).filter((n): n is number => n !== undefined));
  const plunge = median(records.map((r) => r.plungeTempC).filter((n): n is number => n !== undefined));
  const withSets = records.filter((r) => r.sets.length);
  return {
    count: records.length,
    saunaTempC: sauna === null ? null : Math.round(sauna),
    plungeTempC: plunge === null ? null : Math.round(plunge * 10) / 10,
    avgSets: withSets.length
      ? Math.round((withSets.reduce((a, r) => a + r.sets.length, 0) / withSets.length) * 10) / 10
      : null,
    avgTotonoi: Math.round((records.reduce((a, r) => a + r.totonoi, 0) / records.length) * 10) / 10,
  };
}

// ---------- 지금 사우나 중 (타이머) ----------

export type Phase = "sauna" | "plunge" | "rest";
export type Mark = { phase: Phase; at: number };
export type TimerState = { marks: Mark[] };

export const PHASE_LABEL: Record<Phase, string> = { sauna: "사우나", plunge: "냉탕", rest: "외기욕" };
const NEXT: Record<Phase, Phase> = { sauna: "plunge", plunge: "rest", rest: "sauna" };

export function currentPhase(t: TimerState): Phase | null {
  return t.marks.at(-1)?.phase ?? null;
}

/** 버튼 하나: 사우나 → 냉탕 → 외기욕 → 다음 세트 사우나 … */
export function advance(t: TimerState, now: number): TimerState {
  const cur = currentPhase(t);
  return { marks: [...t.marks, { phase: cur ? NEXT[cur] : "sauna", at: now }] };
}

/** 마지막 누름 취소 (잘못 눌렀을 때) */
export function undo(t: TimerState): TimerState {
  return { marks: t.marks.slice(0, -1) };
}

/** 표시용: 냉탕에서 나와 외기욕 중이면 골든타임 남은 초, 아니면 null */
export function goldenRemaining(t: TimerState, now: number): number | null {
  const last = t.marks.at(-1);
  const prev = t.marks.at(-2);
  if (!last || last.phase !== "rest" || prev?.phase !== "plunge") return null;
  const left = GUIDE.goldenSec - Math.floor((now - last.at) / 1000);
  return left > 0 ? left : 0;
}

/** 누른 시각들을 세트로. 사우나를 누를 때마다 새 세트. 마지막 단계는 endAt에서 닫는다. */
export function marksToSets(marks: Mark[], endAt: number): SaunaSet[] {
  const sets: SaunaSet[] = [];
  marks.forEach((m, i) => {
    const until = marks[i + 1]?.at ?? endAt;
    const sec = Math.max(0, Math.round((until - m.at) / 1000));
    if (m.phase === "sauna") sets.push({ saunaSec: sec, plungeSec: 0, restSec: 0 });
    else if (sets.length) sets[sets.length - 1][m.phase === "plunge" ? "plungeSec" : "restSec"] += sec;
  });
  return sets.filter((s) => s.saunaSec >= 30);
}

// ---------- 서버 피드 ----------

/** 공개 기록만 서버로. 같은 id는 최신 내용으로, 좋아요 수는 서버 값 유지. */
export function upsertPublic(list: SessionRecord[], incoming: SessionRecord, cap = 2000): SessionRecord[] {
  // ponytail: 단일 JSON 배열 + 상한 2000. 사용자 늘면 KV 해시나 DB 테이블로 옮기면 된다(이 함수 시그니처 유지).
  if (!incoming.public) return list.filter((r) => r.id !== incoming.id);
  const prev = list.find((r) => r.id === incoming.id);
  if (prev && prev.userId !== incoming.userId) return list; // 남의 기록 덮어쓰기 금지
  const { synced: _drop, ...clean } = incoming;
  void _drop;
  const next = { ...clean, likes: prev?.likes ?? 0 };
  return [next, ...list.filter((r) => r.id !== incoming.id)].sort(byNewest).slice(0, cap);
}

export function removeOwn(list: SessionRecord[], id: string, userId: string) {
  return list.filter((r) => !(r.id === id && r.userId === userId));
}

export function addLike(list: SessionRecord[], id: string) {
  // ponytail: 로그인 없어서 중복 좋아요를 서버가 못 막는다. 클라가 liked 목록으로 한 번만 보낸다. 진짜 로그인 후 (userId,id) 집합으로.
  return list.map((r) => (r.id === id ? { ...r, likes: r.likes + 1 } : r));
}

// ---------- 내보내기 ----------

export function toCSV(records: SessionRecord[]) {
  const head = ["date", "place", "set", "sauna_sec", "plunge_sec", "rest_sec", "sets_measured", "sauna_temp_c", "plunge_temp_c", "totonoi", "source", "stay_min", "started_at"];
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [...records].sort(byNewest).flatMap((r) =>
    (r.sets.length ? r.sets : [null]).map((s, i) =>
      [r.date, r.placeName, s ? i + 1 : "", s?.saunaSec, s?.plungeSec, s?.restSec, s ? (setsMeasured(r.source) ? 1 : 0) : "", r.saunaTempC, r.plungeTempC, r.totonoi, r.source, r.stayMin, r.startedAt]
        .map(esc)
        .join(","),
    ),
  );
  return [head.join(","), ...rows].join("\n");
}

export function fmtDur(sec: number) {
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}분 ${s}초` : `${m}분`;
}

export function fmtClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ---------- 사물함 타이머 ----------

/** 입장(폰을 사물함에 넣을 때)~퇴장(꺼낼 때). 샤워·탕·세신이 다 들어가므로 사우나 시간으로 나누지 않는다. */
export function lockerStay(inAt: number, outAt: number): { stayMin: number; startedAt: string } | null {
  const min = Math.round((outAt - inAt) / 60000);
  if (!Number.isFinite(min) || min < 1 || min > 12 * 60) return null;
  return { stayMin: min, startedAt: new Date(inAt).toISOString() };
}
