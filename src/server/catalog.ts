import { licensedPlaces } from "@/data/places";
import { decodeCsvBytes, diffCatalog, emptyOverlay, NATIONWIDE_CSV, parseNationwide, type CatalogOverlay } from "@/lib/localdata";
import { writeCatalogOverlay } from "@/server/store";

export async function syncNationwide(): Promise<CatalogOverlay> {
  const res = await fetch(NATIONWIDE_CSV, {
    headers: {
      "User-Agent": "Mozilla/5.0 saunagosipda",
      Referer: "https://file.localdata.go.kr/file/general_restaurants/info",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`nationwide ${res.status}`);
  const csv = decodeCsvBytes(new Uint8Array(await res.arrayBuffer()));
  const live = parseNationwide(csv);
  if (live.open.length < 1000) throw new Error("nationwide too small");
  const overlay: CatalogOverlay = {
    ...emptyOverlay,
    fetchedAt: new Date().toISOString(),
    source: NATIONWIDE_CSV,
    ...diffCatalog(licensedPlaces, live),
  };
  await writeCatalogOverlay(overlay);
  return overlay;
}
