import { facilities } from "@/data/facilities";
import { seedVisits } from "@/data/visits";
import { buildFacility } from "@/lib/submission";
import { catalogIssues } from "@/harness/integrity";
import { isBathBusiness, isLicensedId } from "@/data/places";
import {
  applyVisitFacts,
  approveSubmission,
  communityStoreTarget,
  emptyState,
  isDuplicateName,
  isPopulated,
  mergeCommunityState,
  mergeCatalog,
  mergeVisits,
  migrateStorage,
  parseKvPayload,
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

  it("전국 시드가 표본 몇 곳이 아니다", () => {
    expect(facilities.length).toBeGreaterThanOrEqual(4000);
    const licensed = facilities.filter((f) => isLicensedId(f.id));
    expect(licensed.length).toBeGreaterThanOrEqual(4000);
    expect(licensed.every((f) => f.address.length > 4)).toBe(true);
    expect(licensed.every((f) => f.hours === "영업시간 미확인")).toBe(true);
  });

  it("광주·전남·인천 구멍을 지자체 목록으로 메운다", () => {
    const gwangju = facilities.filter((f) => f.regionId === "gwangju" && isLicensedId(f.id));
    const jeonnam = facilities.filter((f) => f.regionId === "jeonnam" && isLicensedId(f.id));
    const incheonHole = facilities.filter(
      (f) => f.regionId === "incheon" && isLicensedId(f.id) && /서구|중구|동구|제물포|영종/.test(f.district),
    );
    expect(gwangju.length).toBeGreaterThan(10);
    expect(jeonnam.length).toBeGreaterThan(20);
    expect(gwangju.some((f) => f.district.includes("서구"))).toBe(true);
    expect(gwangju.some((f) => f.district.includes("동구"))).toBe(true);
    expect(gwangju.some((f) => f.district.includes("남구"))).toBe(true);
    expect(gwangju.some((f) => f.district.includes("광산"))).toBe(true);
    expect(gwangju.filter((f) => f.district.includes("동구")).length).toBeGreaterThan(10);
    expect(gwangju.filter((f) => f.district.includes("광산")).length).toBeGreaterThan(10);
    expect(gwangju.filter((f) => f.district.includes("남구")).length).toBeGreaterThan(10);
    expect(gwangju.some((f) => f.name.includes("명문목욕탕") || f.name.includes("호수"))).toBe(true);
    expect(jeonnam.some((f) => f.name.includes("나주온천"))).toBe(true);
    expect(jeonnam.some((f) => f.district.includes("영암"))).toBe(true);
    expect(jeonnam.some((f) => f.district.includes("목포"))).toBe(true);
    expect(searchFacilities({ q: "목포" }).filter((f) => f.district.includes("목포")).length).toBeGreaterThan(10);
    expect(jeonnam.some((f) => f.district.includes("순천"))).toBe(true);
    expect(jeonnam.some((f) => f.district.includes("담양"))).toBe(true);
    expect(gwangju.filter((f) => f.name.replace(/\s/g, "") === "일곡녹차사우나")).toHaveLength(1);
    expect(incheonHole.length).toBeGreaterThan(20);
    const incheonReorg = facilities.filter(
      (f) => f.regionId === "incheon" && isLicensedId(f.id) && /서해구|검단구|영종구|제물포/.test(f.district),
    );
    expect(incheonReorg.length).toBeGreaterThan(20);
    expect(incheonReorg.some((f) => f.id.startsWith("ld-") && f.district.includes("서해"))).toBe(true);
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
    const state: CommunityState = { ...emptyState(), user: { id: "me", name: "검수자", email: "a@b.c" } };
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
    expect(parseKvPayload({ wants: ["a"] }).wants).toEqual(["a"]);
    expect(parseKvPayload(JSON.stringify({ wants: ["b"] })).wants).toEqual(["b"]);
  });

  it("사활 좋아요는 원본을 덮어쓰지 않고 합친다", () => {
    const merged = mergeVisits(seedVisits.slice(0, 1), [], [seedVisits[0].id]);
    expect(merged[0].likes).toBe(seedVisits[0].likes + 1);
  });

  it("사활 온도가 시설 표기를 덮는다", () => {
    const blank = facilities.find((f) => isLicensedId(f.id));
    expect(blank).toBeTruthy();
    if (!blank) return;
    const [updated] = applyVisitFacts([blank], [
      {
        id: "vx",
        facilityId: blank.id,
        userId: "u",
        userName: "테스터",
        date: "2026-09-16",
        visitNumber: 1,
        body: "냉탕 16도.",
        saunaTemps: [90],
        plungeTemps: [16],
        likes: 0,
        photo: "",
      },
    ]);
    expect(updated.saunas[0].tempC).toBe(90);
    expect(updated.plunges[0].tempC).toBe(16);
    expect(totonoiScore(blank)).toBe(0);
    expect(totonoiScore(updated)).toBeGreaterThan(0);
  });

  it("헬스장 상호는 목욕장업이어도 뺀다", () => {
    expect(isBathBusiness("자마이카 휘트니스", "공동탕업")).toBe(false);
    expect(isBathBusiness("헬스보이짐", "공동탕업")).toBe(false);
    expect(isBathBusiness("퓨어짐", "공동탕업")).toBe(false);
    expect(isBathBusiness("시티짐 마포점", "공동탕업")).toBe(false);
    expect(isBathBusiness("MVGym", "공동탕업")).toBe(false);
    expect(isBathBusiness("베럴짐 헬스앤피티 여의도점", "공동탕업")).toBe(false);
    expect(isBathBusiness("피부,희다 장기점", "공동탕업")).toBe(false);
    expect(isBathBusiness("화령목욕탕", "공동탕업")).toBe(true);
    expect(isBathBusiness("GG사우나", "공동탕업")).toBe(true);
    expect(isBathBusiness("한가족헬스싸우나", "공동탕업")).toBe(true);
    expect(isBathBusiness("아쿠아대중탕헬스", "공동탕업")).toBe(true);
    expect(isBathBusiness("신성헬스탕", "공동탕업")).toBe(true);
    expect(isBathBusiness("아무개", "이용업")).toBe(false);
    expect(facilities.some((f) => f.name.replace(/\s/g, "") === "퓨어짐")).toBe(false);
  });

  it("인허가 행은 성별·예약·설비를 지어내지 않는다", () => {
    const licensed = facilities.filter((f) => isLicensedId(f.id));
    expect(licensed.length).toBeGreaterThan(4000);
    expect(licensed.every((f) => f.genderPolicy === "미확인")).toBe(true);
    expect(licensed.every((f) => f.reservation === false)).toBe(true);
    expect(licensed.every((f) => f.priceFrom === 0)).toBe(true);
    expect(licensed.every((f) => f.saunas.length === 0 && f.plunges.length === 0)).toBe(true);
    expect(licensed.every((f) => !f.totonoi)).toBe(true);
    expect(licensed.every((f) => f.cover === "")).toBe(true);
  });

  it("빈 사활 온도는 인허가 시설에 숫자를 만들지 않는다", () => {
    const blank = facilities.find((f) => isLicensedId(f.id));
    expect(blank).toBeTruthy();
    if (!blank) return;
    const [updated] = applyVisitFacts([blank], [
      {
        id: "ve",
        facilityId: blank.id,
        userId: "u",
        userName: "테스터",
        date: "2026-09-16",
        visitNumber: 1,
        body: "온도는 못 쟀다.",
        saunaTemps: [],
        plungeTemps: [],
        likes: 0,
        photo: "",
      },
    ]);
    expect(updated.saunas).toEqual([]);
    expect(updated.plunges).toEqual([]);
    expect(totonoiScore(updated)).toBe(0);
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

describe("community store target", () => {
  it("Vercel KV나 URL이 있으면 파일 /tmp가 아니다", () => {
    expect(communityStoreTarget({})).toEqual({ kind: "file", path: ".data/community.json" });
    expect(communityStoreTarget({ COMMUNITY_PATH: "/tmp/x.json" })).toEqual({ kind: "file", path: "/tmp/x.json" });
    expect(communityStoreTarget({ VERCEL: "1" })).toEqual({ kind: "file", path: "/tmp/saunagosipda-community.json" });
    expect(communityStoreTarget({ COMMUNITY_STORE_URL: "https://example.test/state" }).kind).toBe("remote");
    expect(communityStoreTarget({ KV_REST_API_URL: "https://kv.test", KV_REST_API_TOKEN: "t" }).kind).toBe("kv");
  });

  it("빈 클라이언트가 사활을 지우지 않는다", () => {
    const visit = {
      id: "vx",
      facilityId: "a",
      userId: "u",
      userName: "테스터",
      date: "2026-09-16",
      visitNumber: 1,
      body: "기록",
      saunaTemps: [90],
      plungeTemps: [16],
      likes: 0,
      photo: "",
    };
    const stored = { ...emptyState(), extraVisits: [visit], wants: ["keep"] };
    const merged = mergeCommunityState(stored, { ...emptyState(), wants: ["new"] });
    expect(merged.extraVisits).toHaveLength(1);
    expect(merged.wants).toEqual(["new"]);
    expect(isPopulated(emptyState())).toBe(false);
    expect(isPopulated(stored)).toBe(true);
  });
});
