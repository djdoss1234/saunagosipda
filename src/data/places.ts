import licensedFile from "@/data/licensed-baths.json";
import type { Facility, FacilityType } from "@/lib/types";

export type LicensedPlace = {
  id: string;
  name: string;
  kind: string;
  type: FacilityType;
  regionId: string;
  district: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
};

export function isLicensedId(id: string) {
  return id.startsWith("ld-") || id.startsWith("gap-");
}

export function isBathBusiness(name: string, kind = "") {
  const n = name.replace(/\s+/g, "");
  const bath = /사우나|싸우나|찜질|목욕|온천|한증|스파|불가마|숯가마|공동탕|대중탕|해수탕|헬스탕/;
  const noise = /휘트니스|피트니스|헬스|골프|필라테스|요가|안마|마사지|피부관리|피부,|네일|짐|gym/i;
  if (/이용업|미용업|세탁/.test(kind)) return false;
  if (noise.test(n) && !bath.test(n)) return false;
  return true;
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
    tags: [row.district, row.type, row.kind, "인허가"].filter(Boolean),
    cover: "",
    gallery: [],
    description: `${row.address}. 행정안전부 목욕장업 인허가상 영업중. 온도·요금·영업시간은 원천에 없어 비워 두었습니다.`,
    crowd: [],
  };
}

export function tempsKnown(facility: Pick<Facility, "saunas" | "plunges">) {
  const hot = Math.max(0, ...facility.saunas.map((s) => s.tempC));
  const cold = Math.min(...facility.plunges.map((s) => s.tempC), 99);
  return hot > 0 && cold > 0 && cold < 90;
}
