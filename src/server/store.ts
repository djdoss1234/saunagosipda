import { communityStoreTarget, emptyState, migrateStorage, parseKvPayload, type CommunityState } from "@/harness/community";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, isAbsolute, join } from "path";

const KV_KEY = "saunagosipda";

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

function kvUrl(base: string, op: "get" | "set") {
  return `${base.replace(/\/$/, "")}/${op}/${KV_KEY}`;
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
