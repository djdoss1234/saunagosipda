import { allPlaces } from "@/data/facilities";
import { searchPlaces } from "@/lib/search";

/** 시설 검색은 서버에서. ?q= 이름·동네, ?region= 시도, ?ids=a,b 한꺼번에. */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const { list, byId } = await allPlaces();
  const ids = sp.get("ids");
  if (ids) {
    const places = ids.split(",").slice(0, 60).map((id) => byId.get(id)).filter(Boolean);
    return Response.json({ places, total: list.length });
  }
  const q = (sp.get("q") ?? "").slice(0, 40);
  const region = sp.get("region") ?? undefined;
  const limit = Math.min(60, Number(sp.get("limit")) || 30);
  return Response.json(
    { places: searchPlaces(q, list, region, limit), total: list.length },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
