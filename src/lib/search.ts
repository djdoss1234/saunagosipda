import { facilities } from "@/data/facilities";
import { regions } from "@/data/regions";
import { totonoiScore } from "@/lib/totonoi";
import type { Facility } from "@/lib/types";

export type SearchParams = {
  q?: string;
  region?: string;
  type?: string;
  gender?: string;
  open24h?: boolean;
  reservation?: boolean;
  maxPrice?: number;
  minSauna?: number;
  maxPlunge?: number;
  amenity?: string;
  outdoor?: boolean;
  totonoiPlunge?: boolean;
  sort?: "want" | "visit" | "rating" | "price" | "totonoi";
};

export function searchFacilities(params: SearchParams): Facility[] {
  const q = params.q?.trim().toLowerCase() ?? "";
  let list = facilities.filter((f) => {
    if (q) {
      const hay = `${f.name} ${f.nameEn} ${f.district} ${f.address} ${f.tags.join(" ")} ${f.type}`.toLowerCase();
      const regionName = regions.find((r) => r.id === f.regionId)?.name ?? "";
      if (!hay.includes(q) && !regionName.includes(params.q ?? "")) return false;
    }
    if (params.region && f.regionId !== params.region) return false;
    if (params.type && f.type !== params.type) return false;
    if (params.gender && f.genderPolicy !== params.gender) return false;
    if (params.open24h && !f.open24h) return false;
    if (params.reservation && !f.reservation) return false;
    if (params.maxPrice && f.priceFrom > params.maxPrice) return false;
    if (params.minSauna) {
      const hot = Math.max(...f.saunas.map((s) => s.tempC));
      if (hot < params.minSauna) return false;
    }
    if (params.maxPlunge) {
      const cold = Math.min(...f.plunges.map((s) => s.tempC));
      if (cold > params.maxPlunge) return false;
    }
    if (params.amenity && !f.amenities.includes(params.amenity)) return false;
    if (params.outdoor) {
      const rest = f.totonoi?.outdoorRest;
      if (rest !== "있음" && rest !== "우수") return false;
    }
    if (params.totonoiPlunge) {
      const cold = Math.min(...f.plunges.map((s) => s.tempC));
      if (cold < 16 || cold > 18) return false;
    }
    return true;
  });

  const sort = params.sort ?? "want";
  list = [...list].sort((a, b) => {
    if (sort === "visit") return b.visitCount - a.visitCount;
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "price") return a.priceFrom - b.priceFrom;
    if (sort === "totonoi") return totonoiScore(b) - totonoiScore(a);
    return b.wantCount - a.wantCount;
  });
  return list;
}

export function suggestions(q: string) {
  const query = q.trim().toLowerCase();
  if (query.length < 1) return [];
  const regionHits = regions
    .filter((r) => r.name.includes(q) || r.id.includes(query))
    .map((r) => ({ kind: "region" as const, id: r.id, label: r.name, hint: "지역" }));
  const facilityHits = facilities
    .filter((f) => f.name.toLowerCase().includes(query) || f.district.includes(q) || f.tags.some((t) => t.includes(q)))
    .slice(0, 6)
    .map((f) => ({
      kind: "facility" as const,
      id: f.id,
      label: f.name,
      hint: `${regions.find((r) => r.id === f.regionId)?.name} ${f.district}`,
    }));
  return [...regionHits, ...facilityHits].slice(0, 8);
}
