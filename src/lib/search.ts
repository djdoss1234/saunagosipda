import { regions } from "@/data/regions";
import type { Place } from "@/lib/types";

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
// 법인 표기는 정렬에서 뺀다: "(주)벽승 명성사우나"가 ㄱ보다 앞에 오지 않게.
const sortKey = (s: string) => s.replace(/^\s*(\(주\)|㈜|주식회사|\(유\)|유한회사)\s*/, "");

/** 이름·지역·주소로 찾는다. 이름이 앞에서 맞는 곳이 먼저. */
export function searchPlaces(q: string, list: Place[], region?: string, limit = 60): Place[] {
  const query = norm(q);
  const regionName = new Map(regions.map((r) => [r.id, r.name]));
  const hits = list.filter((p) => {
    if (region && p.regionId !== region) return false;
    if (!query) return !!region;
    return norm(`${p.name}${regionName.get(p.regionId) ?? ""}${p.district}${p.address}`).includes(query);
  });
  const score = (p: Place) => (norm(p.name).startsWith(query) ? 0 : norm(p.name).includes(query) ? 1 : 2);
  // ponytail: 5천 건 선형 스캔. 키 입력마다 돌아도 1ms대라 인덱스 없이 간다.
  return hits.sort((a, b) => score(a) - score(b) || sortKey(a.name).localeCompare(sortKey(b.name), "ko")).slice(0, limit);
}
