import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid justify-items-center gap-4 py-20 text-center">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-muted">주소가 바뀌었거나 목록에 없는 시설이에요.</p>
      <Link href="/" className="btn-ink px-6">
        내 기록으로
      </Link>
    </div>
  );
}
