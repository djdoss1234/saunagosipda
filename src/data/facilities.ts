import { applyCatalogOverlay, licensedPlaces, licensedToPlace } from "@/data/places";
import type { Place } from "@/lib/types";
import { readCatalogOverlay } from "@/server/store";

// 시설 목록은 행정안전부 LOCALDATA 목욕장업(영업중)만 쓴다. 서버에서만 읽는다(1.6MB를 폰에 보내지 않는다).
// 목록에 없는 곳은 기록할 때 이름을 직접 적으면 된다(placeId 없이 placeName만).
const base: Place[] = licensedPlaces.map(licensedToPlace);

let cache: { at: number; list: Place[]; byId: Map<string, Place> } | null = null;
const TTL = 10 * 60 * 1000;

export async function allPlaces() {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const list = applyCatalogOverlay(base, await readCatalogOverlay());
  cache = { at: Date.now(), list, byId: new Map(list.map((p) => [p.id, p])) };
  return cache;
}

export async function getPlace(id: string | undefined) {
  if (!id) return undefined;
  return (await allPlaces()).byId.get(id);
}
