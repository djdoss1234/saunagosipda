"use client";

import { facilities } from "@/data/facilities";
import { seedVisits } from "@/data/visits";
import {
  approveSubmission as approveInHarness,
  emptyState,
  mergeCatalog,
  mergeVisits,
  parseStorage,
  rejectSubmission as rejectInHarness,
  STORAGE_KEY,
  submitFacility as submitInHarness,
  systemClock,
  type CommunityState,
  type SubmitDraft,
} from "@/harness/community";
import { buildFacility } from "@/lib/submission";
import type { Facility, UserProfile, Visit } from "@/lib/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AppState = {
  ready: boolean;
  user: UserProfile | null;
  wants: string[];
  visits: Visit[];
  submissions: CommunityState["submissions"];
  catalog: Facility[];
  pendingCount: number;
  login: (name: string, email: string) => void;
  logout: () => void;
  toggleWant: (facilityId: string) => boolean;
  addVisit: (visit: Omit<Visit, "id" | "userId" | "userName" | "likes" | "date"> & { photo?: string }) => void;
  likeVisit: (id: string) => void;
  submitFacility: (draft: SubmitDraft) => { ok: boolean; message: string };
  approveSubmission: (id: string) => { ok: boolean; message: string };
  rejectSubmission: (id: string, reason: string) => { ok: boolean; message: string };
};

const Ctx = createContext<AppState | null>(null);

function persist(state: CommunityState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<CommunityState>(emptyState);

  useEffect(() => {
    const migrated = parseStorage(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("saunagosipda.v1"));
    setState(migrated);
    persist(migrated);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    persist(state);
  }, [ready, state]);

  const catalog = useMemo(
    () => mergeCatalog(facilities, state.approvedFacilities),
    [state.approvedFacilities],
  );
  const visits = useMemo(
    () => mergeVisits(seedVisits, state.extraVisits, state.liked),
    [state.extraVisits, state.liked],
  );
  const pendingCount = state.submissions.filter((s) => s.status === "pending").length;

  const value: AppState = {
    ready,
    user: state.user,
    wants: state.wants,
    visits,
    submissions: state.submissions,
    catalog,
    pendingCount,
    login: (name, email) => setState((prev) => ({ ...prev, user: { id: "me", name, email } })),
    logout: () => setState((prev) => ({ ...prev, user: null })),
    toggleWant: (facilityId) => {
      if (!state.user) return false;
      setState((prev) => ({
        ...prev,
        wants: prev.wants.includes(facilityId)
          ? prev.wants.filter((id) => id !== facilityId)
          : [...prev.wants, facilityId],
      }));
      return true;
    },
    addVisit: (visit) => {
      if (!state.user) return;
      const next: Visit = {
        ...visit,
        id: systemClock.id("local"),
        userId: state.user.id,
        userName: state.user.name,
        likes: 0,
        date: systemClock.iso().slice(0, 10),
        photo:
          visit.photo ??
          "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      };
      setState((prev) => ({ ...prev, extraVisits: [next, ...prev.extraVisits] }));
    },
    likeVisit: (id) => {
      setState((prev) => ({
        ...prev,
        liked: prev.liked.includes(id) ? prev.liked : [...prev.liked, id],
      }));
    },
    submitFacility: (draft) => {
      const result = submitInHarness(state, catalog, draft);
      if (!result.ok) return { ok: false, message: result.message };
      setState(result.value);
      return { ok: true, message: "검수 대기로 접수했습니다." };
    },
    approveSubmission: (id) => {
      const result = approveInHarness(state, id, buildFacility);
      if (!result.ok) return { ok: false, message: result.message };
      setState(result.value.state);
      return { ok: true, message: "카탈로그에 올렸습니다." };
    },
    rejectSubmission: (id, reason) => {
      const result = rejectInHarness(state, id, reason);
      if (!result.ok) return { ok: false, message: result.message };
      setState(result.value);
      return { ok: true, message: "반려했습니다." };
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
