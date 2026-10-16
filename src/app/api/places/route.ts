import { allPlaces } from "@/data/facilities";
import { inBounds, isKorea, nearest } from "@/lib/geo";
import { searchPlaces } from "@/lib/search";

const nums = (s: string | null, n: number) => {
  const xs = (s ?? "").split(",").map(Number);
  return xs.length === n && xs.every(Number.isFinite) ? xs : null;
};

/**
 * 시설 검색은 서버에서.
 * ?q= 이름·동네 · ?region= 시도 · ?ids=a,b · ?near=lat,lng 가까운 순 · ?bbox=south,west,north,east 지도 화면 안
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const { list, byId } = await allPlaces();
  const limit = (max: number, dflt: number) => Math.min(max, Number(sp.get("limit")) || dflt);

  const ids = sp.get("ids");
  if (ids) {
    const places = ids.split(",").slice(0, 60).map((id) => byId.get(id)).filter(Boolean);
    return Response.json({ places, total: list.length });
  }

  // 내 위치는 캐시하지 않는다(공유 캐시에 남지 않게).
  const near = nums(sp.get("near"), 2);
  if (near) {
    const from = { lat: near[0], lng: near[1] };
    if (!isKorea(from)) return Response.json({ places: [], total: list.length, outside: true });
    return Response.json({ places: nearest(list, from, limit(50, 20)), total: list.length }, { headers: { "Cache-Control": "no-store" } });
  }

  const bbox = nums(sp.get("bbox"), 4);
  if (bbox) {
    const [south, west, north, east] = bbox;
    return Response.json(
      { places: inBounds(list, { south, west, north, east }, limit(400, 300)), total: list.length },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  }

  const q = (sp.get("q") ?? "").slice(0, 40);
  const region = sp.get("region") ?? undefined;
  return Response.json(
    { places: searchPlaces(q, list, region, limit(60, 30)), total: list.length },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
