import licensedFile from "@/data/licensed-baths.json";
import { isBathBusiness, type CatalogOverlay, type LicensedPlace } from "@/lib/localdata";
import type { Place } from "@/lib/types";

export type { LicensedPlace };
export { isBathBusiness };

export const licensedPlaces = (licensedFile.places as LicensedPlace[]).filter((p) => isBathBusiness(p.name, p.kind));

export function licensedToPlace(row: LicensedPlace): Place {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    regionId: row.regionId,
    district: row.district,
    address: row.address,
    phone: row.phone || undefined,
    ...(row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : {}),
  };
}

/** 인허가 차분(폐업 빼고 신규 더하기)을 목록에 덮는다. */
export function applyCatalogOverlay(list: Place[], overlay: CatalogOverlay | null | undefined): Place[] {
  if (!overlay?.fetchedAt) return list;
  const closed = new Set(overlay.closedIds);
  const kept = list.filter((p) => !closed.has(p.id));
  const have = new Set(kept.map((p) => p.id));
  return [...kept, ...overlay.added.filter((p) => !have.has(p.id) && isBathBusiness(p.name, p.kind)).map(licensedToPlace)];
}
