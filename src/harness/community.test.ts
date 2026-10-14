import { applyCatalogOverlay, isBathBusiness, licensedPlaces, licensedToPlace } from "@/data/places";
import { emptyState, migrateStorage, parseFeedPayload, parseStorage, storeTarget, STORAGE_VERSION, upsertMine } from "@/harness/community";
import {
  addLike,
  advance,
  createRecord,
  defaultSets,
  goldenRemaining,
  GUIDE,
  fmtStay,
  localDate,
  lockerStay,
  paceSets,
  setsMeasured,
  validateDraft,
  marksToSets,
  placeStats,
  recentPlaces,
  removeOwn,
  routine,
  stats,
  toCSV,
  undo,
  upsertPublic,
  type Clock,
  type RecordDraft,
} from "@/harness/records";
import { diffCatalog, emptyOverlay, fingerprint, parseNationwide, regionOf } from "@/lib/localdata";
import { searchPlaces } from "@/lib/search";
import type { Place, SessionRecord } from "@/lib/types";
import { describe, expect, it } from "vitest";

let n = 0;
const clock: Clock = { iso: () => "2026-10-14T10:00:00.000Z", id: (p) => `${p}-${++n}` };
const me = { id: "u-me", name: "민석" };
const TODAY = "2026-10-14";

function draft(over: Partial<RecordDraft> = {}): RecordDraft {
  return {
    placeName: "구룡사우나",
    date: TODAY,
    sets: [{ saunaSec: 480, plungeSec: 60, restSec: 420 }],
    totonoi: 4,
    public: true,
    source: "manual",
    ...over,
  };
}

function rec(over: Partial<RecordDraft> = {}, user = me): SessionRecord {
  const r = createRecord(draft(over), user, clock, TODAY);
  if (!r.ok) throw new Error(r.message);
  return r.value;
}

describe("기록 만들기", () => {
  it("장소·세트·토토노이만 있으면 저장된다", () => {
    const r = createRecord(draft(), me, clock, TODAY);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toMatchObject({ userId: "u-me", userName: "민석", likes: 0, synced: false });
  });
  it("미래 날짜·빈 장소·세트 0개·범위 밖 시간은 막는다", () => {
    expect(createRecord(draft({ date: "2026-10-15" }), me, clock, TODAY).ok).toBe(false);
    expect(createRecord(draft({ placeName: "  " }), me, clock, TODAY).ok).toBe(false);
    expect(createRecord(draft({ sets: [] }), me, clock, TODAY).ok).toBe(false);
    expect(createRecord(draft({ sets: [{ saunaSec: 10, plungeSec: 0, restSec: 0 }] }), me, clock, TODAY).ok).toBe(false);
    expect(createRecord(draft({ plungeTempC: 40 }), me, clock, TODAY).ok).toBe(false);
  });
  it("냉탕 없이 사우나만 한 세트도 기록할 수 있다", () => {
    expect(createRecord(draft({ sets: [{ saunaSec: 600, plungeSec: 0, restSec: 300 }] }), me, clock, TODAY).ok).toBe(true);
  });
  it("현지 날짜를 쓴다 (UTC로 자르지 않는다)", () => {
    expect(localDate(new Date(2026, 9, 14, 0, 30))).toBe("2026-10-14");
  });
});

describe("루틴·기본값", () => {
  it("기록이 없으면 책 기준 3세트", () => {
    const sets = defaultSets([]);
    expect(sets).toHaveLength(GUIDE.sets);
    expect(sets[0]).toEqual({ saunaSec: GUIDE.saunaSec, plungeSec: GUIDE.plungeSec, restSec: GUIDE.restSec });
  });
  it("기록이 있으면 내 중앙값 루틴 (30초 단위)", () => {
    const rs = [
      rec({ sets: [{ saunaSec: 600, plungeSec: 50, restSec: 300 }, { saunaSec: 610, plungeSec: 70, restSec: 300 }] }),
      rec({ sets: [{ saunaSec: 620, plungeSec: 60, restSec: 310 }, { saunaSec: 600, plungeSec: 60, restSec: 300 }] }),
    ];
    expect(routine(rs)).toEqual({ saunaSec: 600, plungeSec: 60, restSec: 300, sets: 2 });
    expect(defaultSets(rs)).toHaveLength(2);
  });
  it("최근 장소는 중복 없이 최신순", () => {
    const rs = [
      rec({ placeName: "A", date: "2026-10-01" }),
      rec({ placeName: "B", date: "2026-10-05" }),
      rec({ placeName: "A", date: "2026-10-10" }),
    ];
    expect(recentPlaces(rs).map((p) => p.placeName)).toEqual(["A", "B"]);
  });
});

describe("통계", () => {
  it("연속 주는 이번 주에 안 갔어도 지난주까지 이어지면 센다", () => {
    const rs = [rec({ date: "2026-10-08" }), rec({ date: "2026-10-01" }), rec({ date: "2026-09-17" })];
    const s = stats(rs, TODAY); // 10/14(수) 주엔 기록 없음
    expect(s.streakWeeks).toBe(2);
    expect(s.thisMonth).toBe(2);
    expect(s.months.at(-1)).toEqual({ month: "2026-10", count: 2 });
  });
  it("시설 통계는 기록이 없으면 null, 온도 없는 기록은 온도 중앙값에서 뺀다", () => {
    expect(placeStats([])).toBeNull();
    const ps = placeStats([rec({ saunaTempC: 90, plungeTempC: 16 }), rec({ saunaTempC: 100 }), rec({ totonoi: 2 })]);
    expect(ps).toMatchObject({ count: 3, saunaTempC: 95, plungeTempC: 16 });
  });
});

describe("타이머", () => {
  it("버튼을 누른 시각이 세트가 된다", () => {
    let t = { marks: [] as { phase: "sauna" | "plunge" | "rest"; at: number }[] };
    const s = 1000;
    t = advance(t, 0); // 사우나
    t = advance(t, 480 * s); // 냉탕
    t = advance(t, 540 * s); // 외기욕
    expect(goldenRemaining(t, 560 * s)).toBe(100);
    t = advance(t, 960 * s); // 2세트 사우나
    t = advance(t, 1500 * s); // 냉탕
    t = advance(t, 1545 * s); // 외기욕
    expect(marksToSets(t.marks, 1845 * s)).toEqual([
      { saunaSec: 480, plungeSec: 60, restSec: 420 },
      { saunaSec: 540, plungeSec: 45, restSec: 300 },
    ]);
  });
  it("잘못 누르면 되돌릴 수 있고, 30초 미만 사우나는 세트로 치지 않는다", () => {
    const t = undo(advance(advance({ marks: [] }, 0), 10_000));
    expect(t.marks).toHaveLength(1);
    expect(marksToSets(t.marks, 20_000)).toEqual([]);
  });
});

describe("서버 피드", () => {
  it("공개만 올라가고, 남의 기록은 덮어쓸 수 없고, 좋아요는 유지된다", () => {
    const mine = rec();
    let list = upsertPublic([], mine);
    list = addLike(list, mine.id);
    list = upsertPublic(list, { ...mine, memo: "수정" });
    expect(list[0]).toMatchObject({ memo: "수정", likes: 1 });
    expect(list[0]).not.toHaveProperty("synced");
    const hijack = upsertPublic(list, { ...mine, userId: "u-other", memo: "탈취" });
    expect(hijack[0].memo).toBe("수정");
    expect(upsertPublic(list, { ...mine, public: false })).toEqual([]);
  });
  it("삭제는 내 것만", () => {
    const mine = rec();
    const list = upsertPublic([], mine);
    expect(removeOwn(list, mine.id, "u-other")).toHaveLength(1);
    expect(removeOwn(list, mine.id, me.id)).toHaveLength(0);
  });
});

describe("로컬 저장 이전", () => {
  it("v2 방문은 세트를 지어내지 않고 비공개 기록으로 옮긴다", () => {
    const s = migrateStorage({
      user: { id: "me", name: "민석", email: "x" },
      wants: ["a"],
      extraVisits: [{ id: "local-1", facilityId: "guryong-sauna", date: "2026-09-01", body: "좋았다", saunaTemps: [100], plungeTemps: [12] }],
    });
    expect(s.version).toBe(STORAGE_VERSION);
    expect(s.records[0]).toMatchObject({ sets: [], public: false, source: "legacy", saunaTempC: 100, plungeTempC: 12 });
  });
  it("깨진 JSON은 빈 상태", () => {
    expect(parseStorage("{")).toEqual(emptyState());
  });
  it("같은 id는 한 번만", () => {
    const r = rec();
    expect(upsertMine(upsertMine([], r), { ...r, memo: "x" })).toHaveLength(1);
  });
});

describe("CSV", () => {
  it("세트당 한 줄, 쉼표·따옴표 이스케이프", () => {
    const csv = toCSV([rec({ placeName: '해운대, "센텀"', sets: [{ saunaSec: 480, plungeSec: 60, restSec: 420 }, { saunaSec: 500, plungeSec: 60, restSec: 400 }] })]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"해운대, ""센텀"""');
  });
});

describe("시설 목록", () => {
  it("헬스·골프만 있는 이름은 목욕장으로 치지 않는다", () => {
    expect(isBathBusiness("OO헬스클럽")).toBe(false);
    expect(isBathBusiness("OO헬스사우나")).toBe(true);
  });
  it("이름·지역으로 찾고, 이름이 앞에서 맞는 곳이 먼저", () => {
    const list: Place[] = [
      { id: "1", name: "해운대 온천", type: "온천", regionId: "busan", district: "해운대구", address: "부산 해운대구 1" },
      { id: "2", name: "온천랜드", type: "온천", regionId: "seoul", district: "중구", address: "서울 중구 1" },
    ];
    expect(searchPlaces("부산", list).map((p) => p.id)).toEqual(["1"]);
    expect(searchPlaces("온천", list).map((p) => p.id)).toEqual(["2", "1"]);
    expect(searchPlaces("", list, "seoul").map((p) => p.id)).toEqual(["2"]);
  });
});

describe("인허가 목록", () => {
  it("전국 목욕장업이 표본 몇 곳이 아니다", () => {
    expect(licensedPlaces.length).toBeGreaterThan(4000);
    expect(new Set(licensedPlaces.map((p) => p.id)).size).toBe(licensedPlaces.length);
    // 원천에 없는 값은 지어내지 않는다: Place에는 온도·요금·영업시간 칸 자체가 없다.
    expect(Object.keys(licensedToPlace(licensedPlaces[0])).sort()).toEqual(["address", "district", "id", "name", "phone", "regionId", "type"]);
  });

  it("폐업 행은 닫고 새 영업은 올린다", () => {
    const csv = `사업장명,관리번호,도로명주소,영업상태명,상세영업상태명,업태구분명,전화번호
열린탕,111-202-1990-00001,광주광역시 동구 금남로 1,영업/정상,영업,공동탕업,062-1
닫힌탕,111-202-1990-00002,광주광역시 동구 금남로 2,폐업,폐업,공동탕업,
새탕,111-202-1990-00003,전라남도 목포시 영산로 1,영업/정상,영업,사우나,
`;
    const live = parseNationwide(csv);
    expect(live.open).toHaveLength(2);
    expect(live.closed).toHaveLength(1);
    expect(regionOf("전남광주통합특별시 목포시 영산로 1")?.regionId).toBe("jeonnam");
    const seed = [
      { id: "ld-111-202-1990-00002", name: "닫힌탕", kind: "공동탕업", type: "사우나" as const, regionId: "gwangju", district: "동구", address: "광주광역시 동구 금남로 2", lat: null, lng: null, phone: "" },
      { id: "ld-keep", name: "유지탕", kind: "공동탕업", type: "사우나" as const, regionId: "gwangju", district: "동구", address: "광주광역시 동구 금남로 9", lat: null, lng: null, phone: "" },
    ];
    const diff = diffCatalog(seed, live);
    expect(diff.closedIds).toContain("ld-111-202-1990-00002");
    expect(fingerprint("일곡녹차사우나", "광주 북구 일곡마을로 10-1, 상가동")).toBe(fingerprint("일곡녹차사우나", "전남광주통합특별시 북구 일곡마을로 10-1 (일곡동)"));
    const merged = applyCatalogOverlay(seed.map(licensedToPlace), { ...emptyOverlay, fetchedAt: "2026-10-14T00:00:00Z", ...diff });
    expect(merged.some((p) => p.id === "ld-111-202-1990-00002")).toBe(false);
    expect(merged.some((p) => p.name === "새탕")).toBe(true);
    expect(applyCatalogOverlay(seed.map(licensedToPlace), emptyOverlay)).toHaveLength(2);
  });
});

describe("서버 저장소", () => {
  it("KV나 URL이 있으면 파일 /tmp가 아니다", () => {
    expect(storeTarget({})).toEqual({ kind: "file", path: ".data/feed.json" });
    expect(storeTarget({ VERCEL: "1" })).toEqual({ kind: "file", path: "/tmp/saunagosipda-feed.json" });
    expect(storeTarget({ KV_REST_API_URL: "https://kv.test", KV_REST_API_TOKEN: "t", VERCEL: "1" }).kind).toBe("kv");
    expect(storeTarget({ COMMUNITY_STORE_URL: "https://x.test" }).kind).toBe("remote");
  });

  it("KV 값이 문자열이든 깨졌든 피드가 터지지 않는다", () => {
    const rec = { id: "r1", userId: "u", placeName: "탕" };
    expect(parseFeedPayload(JSON.stringify([rec]))).toHaveLength(1);
    expect(parseFeedPayload([rec, null, 3])).toHaveLength(1);
    expect(parseFeedPayload("{broken")).toEqual([]);
    expect(parseFeedPayload(null)).toEqual([]);
  });
});

describe("기억으로 기록 / 사물함 타이머", () => {
  const base = [{ saunaSec: 480, plungeSec: 60, restSec: 420 }];
  it("평소보다 길게/짧게는 단위에 맞춰 늘이고 줄인다", () => {
    expect(paceSets(base, "usual")).toEqual(base);
    expect(paceSets(base, "long")).toEqual([{ saunaSec: 600, plungeSec: 75, restSec: 540 }]);
    expect(paceSets(base, "short")).toEqual([{ saunaSec: 360, plungeSec: 45, restSec: 330 }]);
    expect(paceSets([{ saunaSec: 60, plungeSec: 0, restSec: 0 }], "short")).toEqual([{ saunaSec: 60, plungeSec: 0, restSec: 0 }]);
  });

  it("사물함 시간은 머문 시간이고, 세트 시간은 측정이 아니다", () => {
    const t0 = Date.parse("2026-10-14T05:00:00Z");
    expect(lockerStay(t0, t0 + 100 * 60000)).toEqual({ stayMin: 100, startedAt: "2026-10-14T05:00:00.000Z" });
    expect(lockerStay(t0, t0 + 10000)).toBeNull();
    expect(lockerStay(t0, t0 + 13 * 3600000)).toBeNull();
    expect(fmtStay(100)).toBe("1시간 40분");
    expect(fmtStay(45)).toBe("45분");
    expect(setsMeasured("locker")).toBe(false);
    expect(setsMeasured("manual")).toBe(false);
    expect(setsMeasured("timer")).toBe(true);
  });

  it("머문 시간·기록 방식도 검증한다", () => {
    const d = { placeName: "탕", date: TODAY, sets: base, totonoi: 3 as const, public: false, source: "locker" as const, stayMin: 100 };
    expect(validateDraft(d, TODAY).ok).toBe(true);
    expect(validateDraft({ ...d, stayMin: 0 }, TODAY).ok).toBe(false);
    expect(validateDraft({ ...d, source: "hack" as never }, TODAY).ok).toBe(false);
    expect(validateDraft({ ...d, startedAt: "nope" }, TODAY).ok).toBe(false);
  });
});
