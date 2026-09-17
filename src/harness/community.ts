import { licensedToFacility } from "@/data/places";
import type { CatalogOverlay } from "@/lib/localdata";
import type { Facility, FacilitySubmission, UserProfile, Visit } from "@/lib/types";

export const STORAGE_KEY = "saunagosipda.v2";
export const STORAGE_VERSION = 2;

export type CommunityState = {
  version: number;
  user: UserProfile | null;
  wants: string[];
  extraVisits: Visit[];
  liked: string[];
  submissions: FacilitySubmission[];
  approvedFacilities: Facility[];
};

export type Clock = {
  iso: () => string;
  id: (prefix: string) => string;
};

export const systemClock: Clock = {
  iso: () => new Date().toISOString(),
  id: (prefix) => `${prefix}-${Date.now()}`,
};

export function emptyState(): CommunityState {
  return {
    version: STORAGE_VERSION,
    user: null,
    wants: [],
    extraVisits: [],
    liked: [],
    submissions: [],
    approvedFacilities: [],
  };
}

export function nameKey(name: string) {
  return name.trim().replace(/\s+/g, "");
}

export function mergeCatalog(seed: Facility[], approved: Facility[]): Facility[] {
  // ponytail: 승인 시설은 이름 키로 시드를 가린다. 서버 CMS가 생기면 이 병합만 바꾸면 된다.
  const extraIds = new Set(approved.map((f) => f.id));
  const extraNames = new Set(approved.map((f) => nameKey(f.name)));
  return [
    ...approved,
    ...seed.filter((f) => !extraIds.has(f.id) && !extraNames.has(nameKey(f.name))),
  ];
}

export function applyCatalogOverlay(catalog: Facility[], overlay: CatalogOverlay | null | undefined): Facility[] {
  if (!overlay?.fetchedAt) return catalog;
  const closed = new Set(overlay.closedIds);
  const kept = catalog.filter((f) => !closed.has(f.id));
  const have = new Set(kept.map((f) => f.id));
  return [...kept, ...overlay.added.filter((p) => !have.has(p.id)).map(licensedToFacility)];
}

export function isDuplicateName(name: string, catalog: Facility[], submissions: FacilitySubmission[]) {
  const key = nameKey(name);
  if (!key) return false;
  if (catalog.some((f) => nameKey(f.name) === key)) return true;
  return submissions.some((s) => s.status !== "rejected" && nameKey(s.name) === key);
}

export type SubmitDraft = Omit<
  FacilitySubmission,
  "id" | "status" | "createdAt" | "submitterName" | "submitterId" | "reviewedAt" | "rejectReason" | "facilityId"
>;

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

export function submitFacility(
  state: CommunityState,
  catalog: Facility[],
  draft: SubmitDraft,
  clock: Clock = systemClock,
): Result<CommunityState> {
  const user = state.user;
  if (!user) return { ok: false, message: "로그인이 필요합니다." };
  const name = draft.name.trim();
  if (name.length < 2) return { ok: false, message: "시설명을 입력해 주세요." };
  if (!draft.regionId) return { ok: false, message: "지역을 선택해 주세요." };
  if (draft.district.trim().length < 1) return { ok: false, message: "구·군을 입력해 주세요." };
  if (draft.address.trim().length < 4) return { ok: false, message: "주소를 입력해 주세요." };
  if (draft.description.trim().length < 20) return { ok: false, message: "시설 소개는 20자 이상 적어 주세요." };
  if (draft.source.trim().length < 2) return { ok: false, message: "정보 출처를 적어 주세요." };
  if (!Number.isFinite(draft.saunaTemp) || draft.saunaTemp < 40 || draft.saunaTemp > 130) {
    return { ok: false, message: "사우나 온도는 40–130°C 사이로 적어 주세요." };
  }
  if (!Number.isFinite(draft.plungeTemp) || draft.plungeTemp < 1 || draft.plungeTemp > 30) {
    return { ok: false, message: "냉탕 온도는 1–30°C 사이로 적어 주세요." };
  }
  if (!Number.isFinite(draft.priceFrom) || draft.priceFrom < 0) {
    return { ok: false, message: "입장료를 숫자로 적어 주세요." };
  }
  if (isDuplicateName(name, catalog, state.submissions)) {
    return { ok: false, message: "이미 등록됐거나 검수 중인 시설명입니다." };
  }

  const next: FacilitySubmission = {
    ...draft,
    name,
    id: clock.id("sub"),
    status: "pending",
    createdAt: clock.iso(),
    submitterName: user.name,
    submitterId: user.id,
  };
  return { ok: true, value: { ...state, submissions: [next, ...state.submissions] } };
}

export function approveSubmission(
  state: CommunityState,
  id: string,
  build: (sub: FacilitySubmission) => Facility,
  clock: Clock = systemClock,
): Result<{ state: CommunityState; facility: Facility }> {
  if (!state.user) return { ok: false, message: "로그인이 필요합니다." };
  const sub = state.submissions.find((s) => s.id === id);
  if (!sub || sub.status !== "pending") return { ok: false, message: "대기 중인 제보가 아닙니다." };
  const facilityId = `user-${id}`;
  const approved: FacilitySubmission = {
    ...sub,
    status: "approved",
    reviewedAt: clock.iso(),
    facilityId,
  };
  const facility = build(approved);
  return {
    ok: true,
    value: {
      state: {
        ...state,
        submissions: state.submissions.map((s) => (s.id === id ? approved : s)),
        approvedFacilities: [facility, ...state.approvedFacilities.filter((f) => f.id !== facility.id)],
      },
      facility,
    },
  };
}

export function rejectSubmission(
  state: CommunityState,
  id: string,
  reason: string,
  clock: Clock = systemClock,
): Result<CommunityState> {
  if (!state.user) return { ok: false, message: "로그인이 필요합니다." };
  if (reason.trim().length < 4) return { ok: false, message: "반려 사유를 4자 이상 적어 주세요." };
  const sub = state.submissions.find((s) => s.id === id);
  if (!sub || sub.status !== "pending") return { ok: false, message: "대기 중인 제보가 아닙니다." };
  return {
    ok: true,
    value: {
      ...state,
      submissions: state.submissions.map((s) =>
        s.id === id
          ? { ...s, status: "rejected", reviewedAt: clock.iso(), rejectReason: reason.trim() }
          : s,
      ),
    },
  };
}

export function mergeVisits(seed: Visit[], extra: Visit[], liked: string[]) {
  return [...extra, ...seed]
    .map((v) => (liked.includes(v.id) ? { ...v, likes: v.likes + 1 } : v))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function median(values: number[]) {
  const xs = values.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

export function applyVisitFacts(catalog: Facility[], visits: Visit[]): Facility[] {
  const byId = new Map<string, Visit[]>();
  for (const v of visits) {
    const list = byId.get(v.facilityId) ?? [];
    list.push(v);
    byId.set(v.facilityId, list);
  }
  return catalog.map((f) => {
    const vs = byId.get(f.id);
    if (!vs?.length) return f;
    const hot = median(vs.flatMap((v) => v.saunaTemps));
    const cold = median(vs.flatMap((v) => v.plungeTemps));
    if (hot == null && cold == null) return f;
    const saunas =
      hot == null
        ? f.saunas
        : f.saunas.length
          ? f.saunas.map((s, i) => (i === 0 ? { ...s, tempC: Math.round(hot) } : s))
          : [{ name: "사활 중앙값", tempC: Math.round(hot), type: "제보", gender: "공용" as const }];
    const plunges =
      cold == null
        ? f.plunges
        : f.plunges.length
          ? f.plunges.map((s, i) => (i === 0 ? { ...s, tempC: Math.round(cold * 10) / 10 } : s))
          : [{ name: "사활 중앙값", tempC: Math.round(cold * 10) / 10, gender: "공용" as const }];
    return { ...f, saunas, plunges, visitCount: Math.max(f.visitCount, vs.length) };
  });
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function migrateStorage(raw: unknown): CommunityState {
  const base = emptyState();
  if (!isObject(raw)) return base;
  return {
    version: STORAGE_VERSION,
    user: (raw.user as UserProfile | null) ?? null,
    wants: Array.isArray(raw.wants) ? (raw.wants as string[]) : [],
    extraVisits: Array.isArray(raw.extraVisits) ? (raw.extraVisits as Visit[]) : [],
    liked: Array.isArray(raw.liked) ? (raw.liked as string[]) : [],
    submissions: Array.isArray(raw.submissions) ? (raw.submissions as FacilitySubmission[]) : [],
    approvedFacilities: Array.isArray(raw.approvedFacilities) ? (raw.approvedFacilities as Facility[]) : [],
  };
}

export function parseStorage(text: string | null): CommunityState {
  if (!text) return emptyState();
  try {
    return migrateStorage(JSON.parse(text) as unknown);
  } catch {
    return emptyState();
  }
}

export function parseKvPayload(result: unknown): CommunityState {
  if (result == null) return emptyState();
  if (typeof result === "string") return parseStorage(result);
  return migrateStorage(result);
}

export function isPopulated(state: CommunityState) {
  return !!(
    state.user ||
    state.wants.length ||
    state.extraVisits.length ||
    state.liked.length ||
    state.submissions.length ||
    state.approvedFacilities.length
  );
}

function byId<T extends { id: string }>(base: T[], incoming: T[]) {
  const map = new Map(base.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}

export function mergeCommunityState(base: CommunityState, incoming: CommunityState): CommunityState {
  // ponytail: 가고싶어요는 마지막 클라이언트가 이긴다. 사활·제보는 id로 합쳐 빈 PUT이 전체를 지우지 않게 한다.
  return {
    version: STORAGE_VERSION,
    user: incoming.user ?? base.user,
    wants: incoming.wants,
    extraVisits: byId(base.extraVisits, incoming.extraVisits),
    liked: [...new Set([...base.liked, ...incoming.liked])],
    submissions: byId(base.submissions, incoming.submissions),
    approvedFacilities: byId(base.approvedFacilities, incoming.approvedFacilities),
  };
}

/** Korea peninsula bounding box for pin projection */
export const KOREA_BOUNDS = { minLat: 33.1, maxLat: 38.7, minLng: 124.6, maxLng: 131.9 };

export function projectKorea(lat: number, lng: number) {
  // ponytail: 직사각형 투영. 실제 지도 SDK(카카오/네이버)로 바꾸면 이 함수만 교체.
  const { minLat, maxLat, minLng, maxLng } = KOREA_BOUNDS;
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
  return {
    x: Math.min(96, Math.max(4, x)),
    y: Math.min(96, Math.max(4, y)),
  };
}

export function scoreColor(score: number) {
  if (score >= 80) return "#9A3412";
  if (score >= 65) return "#D85A1A";
  if (score >= 50) return "#C4A574";
  return "#7A6E63";
}

export type StoreTarget =
  | { kind: "remote"; url: string; token?: string }
  | { kind: "kv"; url: string; token: string }
  | { kind: "file"; path: string };

export function communityStoreTarget(env: Record<string, string | undefined>): StoreTarget {
  if (env.COMMUNITY_STORE_URL) {
    return { kind: "remote", url: env.COMMUNITY_STORE_URL, token: env.COMMUNITY_STORE_TOKEN };
  }
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    return { kind: "kv", url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN };
  }
  if (env.COMMUNITY_PATH) return { kind: "file", path: env.COMMUNITY_PATH };
  if (env.VERCEL) return { kind: "file", path: "/tmp/saunagosipda-community.json" };
  return { kind: "file", path: ".data/community.json" };
}
