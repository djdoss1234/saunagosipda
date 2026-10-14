import { parseFeedPayload, storeTarget } from "@/harness/community";
import { emptyOverlay, type CatalogOverlay } from "@/lib/localdata";
import type { SessionRecord } from "@/lib/types";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, isAbsolute, join } from "path";

// 서버에는 공개 기록 피드와 인허가 차분만 둔다. 내 비공개 기록은 브라우저에만 있다.
// 예전 키 "saunagosipda"(v2 커뮤니티 상태)는 건드리지 않는다.
const FEED_KEY = "saunagosipda-feed";
const CATALOG_KEY = "saunagosipda-catalog";

function runtimeEnv() {
  // Next inlines process.env.NAME; passing the whole object can drop KV keys.
  return {
    COMMUNITY_STORE_URL: process.env.COMMUNITY_STORE_URL,
    COMMUNITY_STORE_TOKEN: process.env.COMMUNITY_STORE_TOKEN,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    FEED_PATH: process.env.FEED_PATH,
    VERCEL: process.env.VERCEL,
  };
}

const kvUrl = (base: string, op: "get" | "set", key: string) => `${base.replace(/\/$/, "")}/${op}/${key}`;
const filePath = (rel: string) => (isAbsolute(rel) ? rel : join(/* turbopackIgnore: true */ process.cwd(), rel));

function readFile(rel: string): unknown {
  return JSON.parse(readFileSync(/* turbopackIgnore: true */ filePath(rel), "utf8"));
}
function writeFile(rel: string, value: unknown) {
  const file = filePath(rel);
  mkdirSync(/* turbopackIgnore: true */ dirname(file), { recursive: true });
  writeFileSync(/* turbopackIgnore: true */ file, JSON.stringify(value));
}

async function kvGet(url: string, token: string, key: string): Promise<unknown> {
  const res = await fetch(kvUrl(url, "get", key), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return null;
  return ((await res.json()) as { result?: unknown }).result ?? null;
}
async function kvSet(url: string, token: string, key: string, value: unknown) {
  const res = await fetch(kvUrl(url, "set", key), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`kv ${key} ${res.status}`);
}

export async function readFeed(): Promise<SessionRecord[]> {
  const t = storeTarget(runtimeEnv());
  try {
    if (t.kind === "kv") return parseFeedPayload(await kvGet(t.url, t.token, FEED_KEY));
    if (t.kind === "remote") {
      const res = await fetch(t.url, { headers: t.token ? { Authorization: `Bearer ${t.token}` } : {}, cache: "no-store" });
      return res.ok ? parseFeedPayload(await res.json()) : [];
    }
    return parseFeedPayload(readFile(t.path));
  } catch {
    return [];
  }
}

export async function writeFeed(list: SessionRecord[]) {
  const t = storeTarget(runtimeEnv());
  if (t.kind === "kv") return kvSet(t.url, t.token, FEED_KEY, list);
  if (t.kind === "remote") {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (t.token) headers.Authorization = `Bearer ${t.token}`;
    const res = await fetch(t.url, { method: "PUT", headers, body: JSON.stringify(list) });
    if (!res.ok) throw new Error(`remote write ${res.status}`);
    return;
  }
  writeFile(t.path, list);
}

function parseOverlay(raw: unknown): CatalogOverlay {
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return emptyOverlay;
    }
  }
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

const catalogFile = () => (process.env.VERCEL ? "/tmp/saunagosipda-catalog.json" : ".data/catalog.json");

export async function readCatalogOverlay(): Promise<CatalogOverlay> {
  const t = storeTarget(runtimeEnv());
  try {
    if (t.kind === "kv") return parseOverlay(await kvGet(t.url, t.token, CATALOG_KEY));
    return parseOverlay(readFile(catalogFile()));
  } catch {
    return emptyOverlay;
  }
}

export async function writeCatalogOverlay(overlay: CatalogOverlay) {
  const t = storeTarget(runtimeEnv());
  if (t.kind === "kv") return kvSet(t.url, t.token, CATALOG_KEY, overlay);
  writeFile(catalogFile(), overlay);
}
