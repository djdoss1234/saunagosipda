import { readCatalogOverlay } from "@/server/store";
import { syncNationwide } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (request.headers.get("x-vercel-cron") === "1") return true;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) return true;
  return false;
}

const HOUR = 60 * 60 * 1000;

async function run(request: Request) {
  const current = await readCatalogOverlay();
  if (!authorized(request) && current.fetchedAt && Date.now() - Date.parse(current.fetchedAt) < HOUR) {
    return Response.json({ overlay: current, skipped: true });
  }
  try {
    const overlay = await syncNationwide();
    return Response.json({ overlay });
  } catch (err) {
    return Response.json({ overlay: current, error: err instanceof Error ? err.message : "sync failed" }, { status: 502 });
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
