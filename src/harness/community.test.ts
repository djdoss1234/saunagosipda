import { facilities } from "@/data/facilities";
import { seedVisits } from "@/data/visits";
import { buildFacility } from "@/lib/submission";
import { catalogIssues } from "@/harness/integrity";
import {
  approveSubmission,
  emptyState,
  isDuplicateName,
  mergeCatalog,
  mergeVisits,
  migrateStorage,
  parseStorage,
  projectKorea,
  rejectSubmission,
  submitFacility,
  type Clock,
  type CommunityState,
  type SubmitDraft,
} from "@/harness/community";
import { searchFacilities } from "@/lib/search";
import { totonoiScore } from "@/lib/totonoi";
import { describe, expect, it } from "vitest";

const clock: Clock = {
  iso: () => "2026-09-16T00:00:00.000Z",
  id: (prefix) => `${prefix}-1`,
};

function draft(over: Partial<SubmitDraft> = {}): SubmitDraft {
  return {
    name: "테스트사우나",
    regionId: "seoul",
    district: "마포구",
    address: "서울 마포구 테스트로 1",
    type: "사우나",
    phone: "02-000-0000",
    priceFrom: 12000,
    hours: "06:00–24:00",
    genderPolicy: "남녀분리",
    saunaTemp: 90,
    plungeTemp: 16,
    outdoorRest: "있음",
    loop: "좋음",
    humidity: "건식",
    plungeDepth: "어깨",
    restLieDown: true,
    natureView: false,
    tvInSauna: false,
    description: "냉탕이 16도이고 외기욕 벤치가 있어 세 세트가 끊기지 않는다.",
    source: "직접 방문 2026-09-01",
    ...over,
  };
}

describe("catalog integrity", () => {
  it("시설·지역·토토노이 프로필이 한 세트로 맞는다", () => {
    expect(catalogIssues()).toEqual([]);
  });
});

describe("community harness", () => {
  it("로그인 없이 제보하면 거절한다", () => {
    const r = submitFacility(emptyState(), facilities, draft(), clock);
    expect(r.ok).toBe(false);
  });

  it("제보 → 승인하면 카탈로그에 올라간다", () => {
    let state: CommunityState = { ...emptyState(), user: { id: "me", name: "검수자", email: "a@b.c" } };
    const submitted = submitFacility(state, facilities, draft(), clock);
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;
    state = submitted.value;
    expect(state.submissions[0].status).toBe("pending");

    const approved = approveSubmission(state, "sub-1", buildFacility, clock);
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    const catalog = mergeCatalog(facilities, approved.value.state.approvedFacilities);
    expect(catalog.some((f) => f.name === "테스트사우나")).toBe(true);
    expect(searchFacilities({ q: "테스트사우나" }, catalog)).toHaveLength(1);
  });

  it("같은 이름은 검수 중 중복 제보를 막는다", () => {
    let state: CommunityState = { ...emptyState(), user: { id: "me", name: "검수자", email: "a@b.c" } };
    const first = submitFacility(state, facilities, draft(), clock);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    state = first.value;
    const catalog = mergeCatalog(facilities, state.approvedFacilities);
    expect(isDuplicateName("테스트 사우나", catalog, state.submissions)).toBe(true);
    const second = submitFacility(state, catalog, draft({ name: "테스트 사우나" }), clock);
    expect(second.ok).toBe(false);
  });

  it("반려는 사유 없이 안 된다", () => {
    let state: CommunityState = { ...emptyState(), user: { id: "me", name: "검수자", email: "a@b.c" } };
    const submitted = submitFacility(state, facilities, draft(), clock);
    if (!submitted.ok) return;
    const rejected = rejectSubmission(submitted.value, "sub-1", "짧");
    expect(rejected.ok).toBe(false);
  });

  it("v1 스토리지를 깨지지 않게 올린다", () => {
    const migrated = migrateStorage({ user: { id: "me", name: "A", email: "a@b.c" }, wants: ["x"] });
    expect(migrated.version).toBe(2);
    expect(migrated.wants).toEqual(["x"]);
    expect(migrated.submissions).toEqual([]);
    expect(parseStorage("not-json").user).toBeNull();
  });

  it("사활 좋아요는 원본을 덮어쓰지 않고 합친다", () => {
    const merged = mergeVisits(seedVisits.slice(0, 1), [], [seedVisits[0].id]);
    expect(merged[0].likes).toBe(seedVisits[0].likes + 1);
  });
});

describe("totonoi + map", () => {
  it("냉탕 16–18도와 외기욕이 있으면 점수가 올라간다", () => {
    const base = facilities.find((f) => f.id === "guryong-sauna");
    const ocean = facilities.find((f) => f.id === "geoje-sea-sauna");
    expect(base && ocean).toBeTruthy();
    if (!base || !ocean) return;
    expect(totonoiScore(ocean)).toBeGreaterThan(totonoiScore(base));
  });

  it("한반도 좌표를 지도 안으로 투영한다", () => {
    const seoul = projectKorea(37.566, 126.978);
    expect(seoul.x).toBeGreaterThan(10);
    expect(seoul.x).toBeLessThan(50);
    expect(seoul.y).toBeGreaterThan(10);
    expect(seoul.y).toBeLessThan(50);
  });
});
