import { facilities } from "@/data/facilities";
import { regions } from "@/data/regions";
import { totonoiById } from "@/data/totonoiProfiles";

export function catalogIssues() {
  const issues: string[] = [];
  const ids = new Set<string>();
  const regionIds = new Set(regions.map((r) => r.id));

  for (const f of facilities) {
    if (ids.has(f.id)) issues.push(`중복 id: ${f.id}`);
    ids.add(f.id);
    if (!regionIds.has(f.regionId)) issues.push(`${f.id}: 없는 지역 ${f.regionId}`);
    if (!f.saunas.length) issues.push(`${f.id}: 사우나 없음`);
    if (!f.plunges.length) issues.push(`${f.id}: 냉탕 없음`);
    if (!totonoiById[f.id]) issues.push(`${f.id}: 토토노이 프로필 없음`);
    if (!f.totonoi) issues.push(`${f.id}: totonoi 미부착`);
    if (f.lat < 33 || f.lat > 39 || f.lng < 124 || f.lng > 133) {
      issues.push(`${f.id}: 좌표가 한반도 밖`);
    }
  }

  for (const id of Object.keys(totonoiById)) {
    if (!ids.has(id)) issues.push(`고아 토토노이 프로필: ${id}`);
  }

  return issues;
}
