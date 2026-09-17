import type { FacilityType } from "@/lib/types";

export const NATIONWIDE_CSV = "https://file.localdata.go.kr/file/download/public_baths/info";

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

export type CatalogOverlay = {
  fetchedAt: string;
  source: string;
  nationwideOpen: number;
  nationwideClosed: number;
  added: LicensedPlace[];
  closedIds: string[];
  unmatchedSeed: number;
};

export const emptyOverlay: CatalogOverlay = {
  fetchedAt: "",
  source: "",
  nationwideOpen: 0,
  nationwideClosed: 0,
  added: [],
  closedIds: [],
  unmatchedSeed: 0,
};

const SIDO: [string, string][] = [
  ["서울특별시", "seoul"],
  ["부산광역시", "busan"],
  ["대구광역시", "daegu"],
  ["인천광역시", "incheon"],
  ["광주광역시", "gwangju"],
  ["대전광역시", "daejeon"],
  ["울산광역시", "ulsan"],
  ["세종특별자치시", "sejong"],
  ["경기도", "gyeonggi"],
  ["강원특별자치도", "gangwon"],
  ["강원도", "gangwon"],
  ["충청북도", "chungbuk"],
  ["충청남도", "chungnam"],
  ["전북특별자치도", "jeonbuk"],
  ["전라북도", "jeonbuk"],
  ["전라남도", "jeonnam"],
  ["경상북도", "gyeongbuk"],
  ["경상남도", "gyeongnam"],
  ["제주특별자치도", "jeju"],
  ["제주도", "jeju"],
  ["전남광주통합특별시", "gwangju"],
];

const JEONNAM = new Set([
  "목포시", "여수시", "순천시", "나주시", "광양시", "담양군", "곡성군", "구례군",
  "고흥군", "보성군", "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군",
  "함평군", "영광군", "장성군", "완도군", "진도군", "신안군",
]);

export function isBathBusiness(name: string, kind = "") {
  const n = name.replace(/\s+/g, "");
  const bath = /사우나|싸우나|찜질|목욕|온천|한증|스파|불가마|숯가마|공동탕|대중탕|해수탕|헬스탕/;
  const noise = /휘트니스|피트니스|헬스|골프|필라테스|요가|안마|마사지|피부관리|피부,|네일|짐|gym/i;
  if (/이용업|미용업|세탁/.test(kind)) return false;
  if (noise.test(n) && !bath.test(n)) return false;
  return true;
}

export function fingerprint(name: string, addr: string) {
  const n = name.replace(/\s+/g, "");
  let a = addr.replace(/\s+/g, "");
  a = a.replace(/인천광역시|전라남도|전남광주통합특별시|광주광역시/g, "");
  a = a.replace(/^광주/, "");
  a = a.split(/[,（(]/)[0] ?? a;
  a = a.replace(/제물포구|영종구/g, "중구").replace(/서해구|검단구/g, "서구");
  return `${n}|${a}`;
}

export function regionOf(address: string): { regionId: string; district: string } | null {
  const addr = address.trim();
  for (const [prefix, rid] of SIDO) {
    if (!addr.startsWith(prefix)) continue;
    const rest = addr.slice(prefix.length).trim();
    let district = rest.split(/\s+/)[0] || prefix;
    let regionId = rid;
    if (rid === "sejong") district = "세종";
    if (prefix.startsWith("전남광주") && JEONNAM.has(district)) regionId = "jeonnam";
    return { regionId, district };
  }
  for (const district of JEONNAM) {
    if (addr.startsWith(district)) return { regionId: "jeonnam", district };
  }
  const short = addr.match(/^광주\s+(\S+)/);
  if (short) return { regionId: "gwangju", district: short[1] };
  if (addr.startsWith("광산구")) return { regionId: "gwangju", district: "광산구" };
  return null;
}

export function facilityType(kind: string, name: string): FacilityType {
  const blob = `${kind}${name}`;
  if (blob.includes("온천")) return "온천";
  if (blob.includes("찜질") || name.includes("스파랜드") || blob.includes("불한증")) return "찜질방";
  if (name.includes("호텔") || name.includes("리조트")) return "호텔스파";
  return "사우나";
}

function cell(row: Record<string, string>, ...names: string[]) {
  const compact: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) compact[k.replace(/\s+/g, "")] = v;
  for (const name of names) {
    const v = (compact[name.replace(/\s+/g, "")] || "").trim();
    if (v) return v;
  }
  return "";
}

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  const header = (rows.shift() ?? []).map((h) => h.trim());
  return rows
    .filter((r) => r.some((x) => x.trim()))
    .map((r) => {
      const out: Record<string, string> = {};
      header.forEach((h, i) => {
        out[h] = r[i] ?? "";
      });
      return out;
    });
}

export function decodeCsvBytes(raw: Uint8Array): string {
  for (const enc of ["utf-8", "euc-kr"] as const) {
    try {
      const text = new TextDecoder(enc).decode(raw).replace(/^\uFEFF/, "");
      if (text.includes("사업장명")) return text;
    } catch {
      /* Node without euc-kr */
    }
  }
  return new TextDecoder("utf-8").decode(raw);
}

function isClosed(detail: string, status: string) {
  return detail === "폐업" || status.startsWith("폐업") || status.includes("휴업") || detail.includes("휴업");
}

function isOpen(detail: string, status: string) {
  return detail === "영업" || status.startsWith("영업");
}

function placeFromRow(row: Record<string, string>): LicensedPlace | null {
  const name = cell(row, "사업장명");
  const addr = cell(row, "도로명주소") || cell(row, "지번주소");
  const mgt = cell(row, "관리번호");
  if (!name || !addr || !mgt) return null;
  const loc = regionOf(addr);
  if (!loc) return null;
  const kind = cell(row, "업태구분명", "위생업태명");
  const phone = cell(row, "전화번호").replace(/[^0-9+]/g, "");
  return {
    id: "ld-" + mgt.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, ""),
    name,
    kind,
    type: facilityType(kind, name),
    regionId: loc.regionId,
    district: loc.district,
    address: addr,
    lat: null,
    lng: null,
    phone,
  };
}

export function parseNationwide(text: string): { open: LicensedPlace[]; closed: LicensedPlace[] } {
  const open: LicensedPlace[] = [];
  const closed: LicensedPlace[] = [];
  for (const row of parseCsv(text)) {
    const detail = cell(row, "상세영업상태명");
    const status = cell(row, "영업상태명");
    const place = placeFromRow(row);
    if (!place) continue;
    if (isClosed(detail, status)) closed.push(place);
    else if (isOpen(detail, status)) open.push(place);
  }
  return { open, closed };
}

export function diffCatalog(seed: LicensedPlace[], live: { open: LicensedPlace[]; closed: LicensedPlace[] }): Pick<
  CatalogOverlay,
  "added" | "closedIds" | "unmatchedSeed" | "nationwideOpen" | "nationwideClosed"
> {
  const seedIds = new Set(seed.map((p) => p.id));
  const seedFp = new Map(seed.map((p) => [fingerprint(p.name, p.address), p.id]));
  const openId = new Set(live.open.map((p) => p.id));
  const openFp = new Set(live.open.map((p) => fingerprint(p.name, p.address)));
  const closedId = new Set(live.closed.map((p) => p.id));
  const closedFp = new Set(live.closed.map((p) => fingerprint(p.name, p.address)));

  const closedIds: string[] = [];
  let unmatchedSeed = 0;
  for (const s of seed) {
    const fp = fingerprint(s.name, s.address);
    if (openId.has(s.id) || openFp.has(fp)) continue;
    if (closedId.has(s.id) || closedFp.has(fp)) closedIds.push(s.id);
    else unmatchedSeed += 1;
  }

  const added = live.open.filter((p) => {
    if (!isBathBusiness(p.name, p.kind)) return false;
    const fp = fingerprint(p.name, p.address);
    return !seedIds.has(p.id) && !seedFp.has(fp);
  });

  return {
    nationwideOpen: live.open.length,
    nationwideClosed: live.closed.length,
    added,
    closedIds,
    unmatchedSeed,
  };
}
