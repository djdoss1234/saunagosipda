import licensedFile from "@/data/licensed-baths.json";
import { isBathBusiness, type LicensedPlace } from "@/lib/localdata";
import type { Facility } from "@/lib/types";

export type { LicensedPlace };
export { isBathBusiness };

export function isLicensedId(id: string) {
  return id.startsWith("ld-") || id.startsWith("gap-");
}

export function hasKoreaCoords(lat: number, lng: number) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 133;
}

export const licensedPlaces = (licensedFile.places as LicensedPlace[]).filter((p) => isBathBusiness(p.name, p.kind));

export function licensedToFacility(row: LicensedPlace): Omit<Facility, "totonoi"> {
  const open24h = /24시|연중무휴/.test(row.name);
  return {
    id: row.id,
    name: row.name,
    nameEn: "",
    type: row.type,
    regionId: row.regionId,
    district: row.district,
    address: row.address,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    phone: row.phone || "미기재",
    priceFrom: 0,
    hours: "영업시간 미확인",
    open24h,
    reservation: false,
    genderPolicy: "미확인",
    saunas: [],
    plunges: [],
    amenities: [],
    wantCount: 0,
    visitCount: 0,
    rating: 0,
    tags: [row.district, row.type].filter(Boolean),
    cover: "",
    gallery: [],
    description: row.address,
    crowd: [],
  };
}

export function tempsKnown(facility: Pick<Facility, "saunas" | "plunges">) {
  const hot = Math.max(0, ...facility.saunas.map((s) => s.tempC));
  const cold = Math.min(...facility.plunges.map((s) => s.tempC), 99);
  return hot > 0 && cold > 0 && cold < 90;
}
