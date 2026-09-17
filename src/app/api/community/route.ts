import { isPopulated, mergeCommunityState, migrateStorage } from "@/harness/community";
import { readCommunity, writeCommunity } from "@/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ state: await readCommunity() });
}

export async function PUT(request: Request) {
  const incoming = migrateStorage(await request.json().catch(() => null));
  const current = await readCommunity();
  if (!isPopulated(incoming) && isPopulated(current)) {
    return Response.json({ ok: true });
  }
  await writeCommunity(mergeCommunityState(current, incoming));
  return Response.json({ ok: true });
}
