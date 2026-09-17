import { communityStoreTarget, emptyState, migrateStorage, parseKvPayload, type CommunityState } from "@/harness/community";
import { emptyOverlay, type CatalogOverlay } from "@/lib/localdata";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, isAbsolute, join } from "path";

const KV_KEY = "saunagosipda";
const CATALOG_KEY = "saunagosipda-catalog";

function runtimeEnv() {
  // Next inlines process.env.NAME; passing the whole object can drop KV keys.
  return {
    COMMUNITY_STORE_URL: process.env.COMMUNITY_STORE_URL,
    COMMUNITY_STORE_TOKEN: process.env.COMMUNITY_STORE_TOKEN,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    COMMUNITY_PATH: process.env.COMMUNITY_PATH,
    VERCEL: process.env.VERCEL,
  };
}

function kvUrl(base: string, op: "get" | "set", key = KV_KEY) {
  return `${base.replace(/\/$/, "")}/${op}/${key}`;
}

function catalogFile() {
  if (process.env.VERCEL) return "/tmp/saunagosipda-catalog.json";
  return ".data/catalog.json";
}

function filePath(rel: string) {
  return isAbsolute(rel) ? rel : join(/* turbopackIgnore: true */ process.cwd(), rel);
}

export async function readCommunity(): Promise<CommunityState> {
  const target = communityStoreTarget(runtimeEnv());
  try {
    if (target.kind === "kv") {
      const res = await fetch(kvUrl(target.url, "get"), {
        headers: { Authorization: `Bearer ${target.token}` },
        cache: "no-store",
      });
      if (!res.ok) return emptyState();
      const body = (await res.json()) as { result?: unknown };
      return parseKvPayload(body.result);
    }
    if (target.kind === "remote") {
      const headers: Record<string, string> = {};
      if (target.token) headers.Authorization = `Bearer ${target.token}`;
      const res = await fetch(target.url, { headers, cache: "no-store" });
      if (!res.ok) return emptyState();
      return migrateStorage(await res.json());
    }
    return migrateStorage(JSON.parse(readFileSync(/* turbopackIgnore: true */ filePath(target.path), "utf8")) as unknown);
  } catch {
    return emptyState();
  }
}

export async function writeCommunity(state: CommunityState) {
  const target = communityStoreTarget(runtimeEnv());
  if (target.kind === "kv") {
    const res = await fetch(kvUrl(target.url, "set"), {
      method: "POST",
      headers: { Authorization: `Bearer ${target.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!res.ok) throw new Error(`kv write ${res.status}`);
    return;
  }
  if (target.kind === "remote") {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (target.token) headers.Authorization = `Bearer ${target.token}`;
    const res = await fetch(target.url, { method: "PUT", headers, body: JSON.stringify(state) });
    if (!res.ok) throw new Error(`remote write ${res.status}`);
    return;
  }
  const file = filePath(target.path);
  mkdirSync(/* turbopackIgnore: true */ dirname(file), { recursive: true });
  writeFileSync(/* turbopackIgnore: true */ file, JSON.stringify(state));
}

function parseOverlay(raw: unknown): CatalogOverlay {
  if (!raw || typeof raw !== "object") return emptyOverlay;
  const o = raw as CatalogOverlay;
  if (typeof o.fetchedAt !== "string") return emptyOverlay;
  return {
    fetchedAt: o.fetchedAt,
    source: typeof o.source === "string" ? o.source : "",
    nationwideOpen: Number(o.nationwideOpen) || 0,
    nationwideClosed: Number(o.nationwideClosed) || 0,
    added: Array.isArray(o.added) ? o.added : [],
    closedIds: Array.isArray(o.closedIds) ? o.closedIds : [],
    unmatchedSeed: Number(o.unmatchedSeed) || 0,
  };
}

export async function readCatalogOverlay(): Promise<CatalogOverlay> {
  const target = communityStoreTarget(runtimeEnv());
  try {
    if (target.kind === "kv") {
      const res = await fetch(kvUrl(target.url, "get", CATALOG_KEY), {
        headers: { Authorization: `Bearer ${target.token}` },
        cache: "no-store",
      });
      if (!res.ok) return emptyOverlay;
      const body = (await res.json()) as { result?: unknown };
      const raw = body.result;
      if (raw == null) return emptyOverlay;
      return parseOverlay(typeof raw === "string" ? JSON.parse(raw) : raw);
    }
    return parseOverlay(JSON.parse(readFileSync(/* turbopackIgnore: true */ filePath(catalogFile()), "utf8") as string));
  } catch {
    return emptyOverlay;
  }
}

export async function writeCatalogOverlay(overlay: CatalogOverlay) {
  const target = communityStoreTarget(runtimeEnv());
  if (target.kind === "kv") {
    const res = await fetch(kvUrl(target.url, "set", CATALOG_KEY), {
      method: "POST",
      headers: { Authorization: `Bearer ${target.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(overlay),
    });
    if (!res.ok) throw new Error(`kv catalog ${res.status}`);
    return;
  }
  const file = filePath(catalogFile());
  mkdirSync(/* turbopackIgnore: true */ dirname(file), { recursive: true });
  writeFileSync(/* turbopackIgnore: true */ file, JSON.stringify(overlay));
}
