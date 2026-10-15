import type { SessionRecord, Totonoi, UserProfile } from "@/lib/types";

export const STORAGE_KEY = "saunagosipda.v3";
export const STORAGE_VERSION = 3;
/** 예전 키. 읽기만 하고 v3로 옮긴다. */
export const LEGACY_KEYS = ["saunagosipda.v2", "saunagosipda.v1"];

/** 브라우저에 사는 내 상태. 내 기록(비공개 포함)은 여기, 남의 공개 기록은 서버 피드. */
export type LocalState = {
  version: number;
  user: UserProfile | null;
  wants: string[];
  records: SessionRecord[];
  liked: string[];
  /** 안정시 심박(bpm). 기기에만 둔다. 나올 맥박 안내용. */
  restingHr: number | null;
};

export function emptyState(): LocalState {
  return { version: STORAGE_VERSION, user: null, wants: [], records: [], liked: [], restingHr: null };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** v2 방문(Visit) → 기록. 세트는 받은 적이 없으니 비운다(지어내지 않는다). */
function fromLegacyVisit(v: Record<string, unknown>, user: UserProfile): SessionRecord | null {
  if (typeof v.id !== "string" || typeof v.date !== "string") return null;
  const temps = (k: string) => (Array.isArray(v[k]) ? (v[k] as number[]).filter((n) => n > 0) : []);
  return {
    id: v.id,
    userId: user.id,
    userName: user.name,
    placeId: typeof v.facilityId === "string" ? v.facilityId : undefined,
    placeName: typeof v.facilityId === "string" ? v.facilityId : "이전 방문",
    date: v.date,
    createdAt: `${v.date}T00:00:00.000Z`,
    sets: [],
    totonoi: 3 as Totonoi,
    saunaTempC: temps("saunaTemps")[0],
    plungeTempC: temps("plungeTemps")[0],
    memo: typeof v.body === "string" ? v.body.slice(0, 500) : undefined,
    food: typeof v.food === "string" ? v.food : undefined,
    public: false,
    source: "legacy",
    likes: 0,
  };
}

export function migrateStorage(raw: unknown): LocalState {
  const base = emptyState();
  if (!isObject(raw)) return base;
  const u = raw.user;
  const user =
    isObject(u) && typeof u.id === "string" && typeof u.name === "string" ? { id: u.id, name: u.name } : null;
  if (raw.version === STORAGE_VERSION) {
    return {
      ...base,
      user,
      wants: strings(raw.wants),
      liked: strings(raw.liked),
      records: Array.isArray(raw.records) ? (raw.records as SessionRecord[]) : [],
      restingHr: typeof raw.restingHr === "number" && raw.restingHr >= 35 && raw.restingHr <= 120 ? raw.restingHr : null,
    };
  }
  // v2: { user, wants, extraVisits, liked, submissions, approvedFacilities }
  const legacy = Array.isArray(raw.extraVisits) && user
    ? (raw.extraVisits as unknown[]).filter(isObject).map((v) => fromLegacyVisit(v, user)).filter((r): r is SessionRecord => !!r)
    : [];
  return { ...base, user, wants: strings(raw.wants), liked: strings(raw.liked), records: legacy };
}

export function parseStorage(text: string | null): LocalState {
  if (!text) return emptyState();
  try {
    return migrateStorage(JSON.parse(text) as unknown);
  } catch {
    return emptyState();
  }
}

export function upsertMine(records: SessionRecord[], rec: SessionRecord) {
  return [rec, ...records.filter((r) => r.id !== rec.id)];
}

export type StoreTarget =
  | { kind: "remote"; url: string; token?: string }
  | { kind: "kv"; url: string; token: string }
  | { kind: "file"; path: string };

/** 서버 저장소: 원격 URL > Vercel KV(Upstash REST) > 파일. Vercel에서 KV 없이 /tmp면 인스턴스가 바뀔 때 날아간다. */
export function storeTarget(env: Record<string, string | undefined>): StoreTarget {
  if (env.COMMUNITY_STORE_URL) return { kind: "remote", url: env.COMMUNITY_STORE_URL, token: env.COMMUNITY_STORE_TOKEN };
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) return { kind: "kv", url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN };
  if (env.FEED_PATH) return { kind: "file", path: env.FEED_PATH };
  if (env.VERCEL) return { kind: "file", path: "/tmp/saunagosipda-feed.json" };
  return { kind: "file", path: ".data/feed.json" };
}

/** KV GET 결과는 문자열(JSON)이거나 이미 파싱된 값이다. 깨진 값은 빈 피드. */
export function parseFeedPayload(raw: unknown): SessionRecord[] {
  let v = raw;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? (v.filter((r) => r && typeof r === "object" && typeof r.id === "string") as SessionRecord[]) : [];
}
