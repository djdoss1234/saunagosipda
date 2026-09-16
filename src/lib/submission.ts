import { regionCoords } from "@/data/regions";
import type { Facility, FacilitySubmission } from "@/lib/types";

const COVER =
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80";

export function buildFacility(sub: FacilitySubmission): Facility {
  const center = regionCoords[sub.regionId] ?? regionCoords.seoul;
  const jitter = (n: number) => (n % 17) * 0.004 - 0.03;
  const seed = sub.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    id: sub.facilityId ?? `user-${sub.id}`,
    name: sub.name.trim(),
    nameEn: sub.name.trim(),
    type: sub.type,
    regionId: sub.regionId,
    district: sub.district.trim(),
    address: sub.address.trim(),
    lat: center.lat + jitter(seed),
    lng: center.lng + jitter(seed * 3),
    phone: sub.phone.trim() || "미확인",
    priceFrom: sub.priceFrom,
    hours: sub.hours.trim() || "확인 필요",
    open24h: sub.hours.includes("24"),
    reservation: false,
    genderPolicy: sub.genderPolicy,
    saunas: [{ name: "사우나", tempC: sub.saunaTemp, type: sub.humidity === "건식" ? "건식" : "습식", gender: "공용" }],
    plunges: [{ name: "냉탕", tempC: sub.plungeTemp, gender: "공용" }],
    amenities: [sub.outdoorRest === "있음" || sub.outdoorRest === "우수" ? "외기욕" : ""].filter(Boolean),
    wantCount: 0,
    visitCount: 0,
    rating: 0,
    tags: ["이용자 제보", sub.type],
    cover: COVER,
    gallery: [COVER],
    description: sub.description.trim(),
    crowd: [1, 1, 2, 2, 3, 3, 2, 2, 3, 2, 1, 1],
    totonoi: {
      outdoorRest: sub.outdoorRest,
      loop: sub.loop,
      humidity: sub.humidity,
      tvInSauna: sub.tvInSauna,
      restLieDown: sub.restLieDown,
      natureView: sub.natureView,
      plungeDepth: sub.plungeDepth,
    },
  };
}
