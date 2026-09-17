import type { GenderPolicy } from "@/lib/types";

export function formatWon(n: number) {
  if (n <= 0) return "요금 미확인";
  return `${n.toLocaleString("ko-KR")}원`;
}

export function formatCount(n: number) {
  return n.toLocaleString("ko-KR");
}

export function formatGender(policy: GenderPolicy) {
  return policy === "미확인" ? "입장 미확인" : policy;
}

export function telHref(phone: string) {
  if (!phone || phone === "미기재" || phone === "미확인" || !/\d/.test(phone)) return null;
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function avgTemp(values: number[]) {
  if (!values.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
