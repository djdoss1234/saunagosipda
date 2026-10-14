"use client";

import { emptyState, LEGACY_KEYS, parseStorage, STORAGE_KEY, upsertMine, type LocalState } from "@/harness/community";
import { createRecord, systemClock, type RecordDraft } from "@/harness/records";
import type { SessionRecord, UserProfile } from "@/lib/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AppState = {
  ready: boolean;
  user: UserProfile | null;
  /** 내 기록 (비공개 포함), 최신순 아님 — 화면에서 정렬 */
  records: SessionRecord[];
  wants: string[];
  liked: string[];
  feed: SessionRecord[];
  feedReady: boolean;
  setName: (name: string) => UserProfile;
  saveRecord: (draft: RecordDraft, opts?: { id?: string; user?: UserProfile }) => { ok: true; record: SessionRecord } | { ok: false; message: string };
  deleteRecord: (id: string) => void;
  toggleWant: (placeId: string) => void;
  like: (id: string) => void;
  refreshFeed: () => void;
  resetAll: () => void;
};

const Ctx = createContext<AppState | null>(null);

function load(): LocalState {
  try {
    const cur = localStorage.getItem(STORAGE_KEY);
    if (cur) return parseStorage(cur);
    for (const k of LEGACY_KEYS) {
      const old = localStorage.getItem(k);
      if (old) return parseStorage(old);
    }
  } catch {
    // 사파리 개인정보 모드 등: 메모리로만 동작
  }
  return emptyState();
}

function persist(state: LocalState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 실패해도 화면은 계속 쓴다
  }
}

async function post(body: unknown) {
  const res = await fetch("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocalState>(emptyState);
  const [ready, setReady] = useState(false);
  const [feed, setFeed] = useState<SessionRecord[]>([]);
  const [feedReady, setFeedReady] = useState(false);

  const refreshFeed = useCallback(() => {
    fetch("/api/records")
      .then((r) => (r.ok ? r.json() : { records: [] }))
      .then((b: { records?: SessionRecord[] }) => setFeed(b.records ?? []))
      .catch(() => {})
      .finally(() => setFeedReady(true));
  }, []);

  useEffect(() => {
    const s = load();
    // 외부 저장소(localStorage)에서 한 번 읽어 오는 초기화라 effect 안 setState가 맞다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(s);
    setReady(true);
    refreshFeed();
  }, [refreshFeed]);

  useEffect(() => {
    if (ready) persist(state);
  }, [ready, state]);

  // 오프라인에서 저장한 공개 기록을 다시 올린다
  useEffect(() => {
    if (!ready) return;
    const pending = state.records.filter((r) => r.public && !r.synced);
    if (!pending.length) return;
    let alive = true;
    (async () => {
      const done: string[] = [];
      for (const r of pending) {
        if (await post({ action: "upsert", record: r }).catch(() => false)) done.push(r.id);
      }
      if (!alive || !done.length) return;
      setState((prev) => ({
        ...prev,
        records: prev.records.map((r) => (done.includes(r.id) ? { ...r, synced: true } : r)),
      }));
      refreshFeed();
    })();
    return () => {
      alive = false;
    };
  }, [ready, state.records, refreshFeed]);

  const value = useMemo<AppState>(
    () => ({
      ready,
      user: state.user,
      records: state.records,
      wants: state.wants,
      liked: state.liked,
      feed,
      feedReady,
      setName: (name) => {
        const clean = name.trim().slice(0, 20);
        const next: UserProfile = { id: state.user?.id ?? systemClock.id("u"), name: clean };
        setState((s) => ({
          ...s,
          user: next,
          records: s.records.map((r) => ({ ...r, userName: clean, synced: r.public ? false : r.synced })),
        }));
        return next;
      },
      saveRecord: (draft, opts) => {
        const user = opts?.user ?? state.user;
        const id = opts?.id;
        if (!user) return { ok: false, message: "닉네임을 먼저 정해 주세요." };
        const made = createRecord(draft, user);
        if (!made.ok) return made;
        const prev = id ? state.records.find((r) => r.id === id) : undefined;
        const record: SessionRecord = prev
          ? { ...made.value, id: prev.id, createdAt: prev.createdAt, likes: prev.likes }
          : made.value;
        if (prev?.public && !record.public) post({ action: "delete", id: prev.id, userId: user.id }).catch(() => {});
        setState((s) => ({ ...s, records: upsertMine(s.records, record) }));
        return { ok: true, record };
      },
      deleteRecord: (id) => {
        const user = state.user;
        const r = state.records.find((x) => x.id === id);
        setState((s) => ({ ...s, records: s.records.filter((x) => x.id !== id) }));
        if (user && r?.public) post({ action: "delete", id, userId: user.id }).then(refreshFeed).catch(() => {});
      },
      toggleWant: (placeId) =>
        setState((s) => ({
          ...s,
          wants: s.wants.includes(placeId) ? s.wants.filter((x) => x !== placeId) : [...s.wants, placeId],
        })),
      like: (id) => {
        if (state.liked.includes(id)) return;
        setState((s) => ({ ...s, liked: [...s.liked, id] }));
        setFeed((f) => f.map((r) => (r.id === id ? { ...r, likes: r.likes + 1 } : r)));
        post({ action: "like", id }).catch(() => {});
      },
      refreshFeed,
      resetAll: () => {
        setState(emptyState());
        try {
          [STORAGE_KEY, ...LEGACY_KEYS].forEach((k) => localStorage.removeItem(k));
        } catch {
          // 무시
        }
      },
    }),
    [ready, state, feed, feedReady, refreshFeed],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
