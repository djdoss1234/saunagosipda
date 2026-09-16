export function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function formatCount(n: number) {
  return n.toLocaleString("ko-KR");
}

export function avgTemp(values: number[]) {
  if (!values.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
