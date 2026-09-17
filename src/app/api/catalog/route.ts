import { readCatalogOverlay } from "@/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ overlay: await readCatalogOverlay() });
}
