import { addLike, localDate, removeOwn, upsertPublic, validateDraft } from "@/harness/records";
import type { SessionRecord } from "@/lib/types";
import { readFeed, writeFeed } from "@/server/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const place = new URL(request.url).searchParams.get("place");
  const feed = await readFeed();
  return Response.json({ records: place ? feed.filter((r) => r.placeId === place) : feed.slice(0, 200) });
}

type Body =
  | { action: "upsert"; record: SessionRecord }
  | { action: "like"; id: string }
  | { action: "delete"; id: string; userId: string };

const str = (v: unknown, max: number) => typeof v === "string" && v.length > 0 && v.length <= max;

// ponytail: KV 한 키를 읽고-고치고-쓴다. 동시 저장이 겹치면 한쪽이 질 수 있다. 하루 수백 건 넘으면 레코드별 키로 쪼갠다.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body || typeof body !== "object") return Response.json({ ok: false, message: "잘못된 요청" }, { status: 400 });
  const feed = await readFeed();

  if (body.action === "like" && str(body.id, 80)) {
    await writeFeed(addLike(feed, body.id));
    return Response.json({ ok: true });
  }
  if (body.action === "delete" && str(body.id, 80) && str(body.userId, 80)) {
    await writeFeed(removeOwn(feed, body.id, body.userId));
    return Response.json({ ok: true });
  }
  if (body.action === "upsert" && body.record) {
    const r = body.record;
    if (!str(r.id, 80) || !str(r.userId, 80) || !str(r.userName, 20) || !str(r.createdAt, 40)) {
      return Response.json({ ok: false, message: "기록 형식이 맞지 않아요." }, { status: 400 });
    }
    // 클라는 현지 날짜(KST)라 서버 UTC보다 하루 앞설 수 있다.
    const v = validateDraft(r, localDate(new Date(Date.now() + 86400000)));
    if (!v.ok) return Response.json(v, { status: 400 });
    await writeFeed(upsertPublic(feed, { ...r, ...v.value, likes: 0 }));
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, message: "잘못된 요청" }, { status: 400 });
}
