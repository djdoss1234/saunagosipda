"use client";

import { seedVisits } from "@/data/visits";
import type { UserProfile, Visit } from "@/lib/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AppState = {
  ready: boolean;
  user: UserProfile | null;
  wants: string[];
  visits: Visit[];
  login: (name: string, email: string) => void;
  logout: () => void;
  toggleWant: (facilityId: string) => boolean;
  addVisit: (visit: Omit<Visit, "id" | "userId" | "userName" | "likes" | "date"> & { photo?: string }) => void;
  likeVisit: (id: string) => void;
};

const KEY = "saunagosipda.v1";
const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wants, setWants] = useState<string[]>([]);
  const [extraVisits, setExtraVisits] = useState<Visit[]>([]);
  const [liked, setLiked] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          user?: UserProfile | null;
          wants?: string[];
          extraVisits?: Visit[];
          liked?: string[];
        };
        setUser(parsed.user ?? null);
        setWants(parsed.wants ?? []);
        setExtraVisits(parsed.extraVisits ?? []);
        setLiked(parsed.liked ?? []);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify({ user, wants, extraVisits, liked }));
  }, [ready, user, wants, extraVisits, liked]);

  const visits = useMemo(() => {
    const merged = [...extraVisits, ...seedVisits].map((v) =>
      liked.includes(v.id) ? { ...v, likes: v.likes + 1 } : v,
    );
    return merged.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [extraVisits, liked]);

  const value: AppState = {
    ready,
    user,
    wants,
    visits,
    login: (name, email) => setUser({ id: "me", name, email }),
    logout: () => setUser(null),
    toggleWant: (facilityId) => {
      if (!user) return false;
      setWants((prev) =>
        prev.includes(facilityId) ? prev.filter((id) => id !== facilityId) : [...prev, facilityId],
      );
      return true;
    },
    addVisit: (visit) => {
      if (!user) return;
      const next: Visit = {
        ...visit,
        id: `local-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        likes: 0,
        date: new Date().toISOString().slice(0, 10),
        photo:
          visit.photo ??
          "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      };
      setExtraVisits((prev) => [next, ...prev]);
    },
    likeVisit: (id) => {
      setLiked((prev) => (prev.includes(id) ? prev : [...prev, id]));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
