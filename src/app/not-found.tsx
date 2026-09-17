import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-wrap max-w-md py-20 text-center">
      <p className="kicker">404</p>
      <h1 className="mt-3 font-serif text-3xl">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">주소가 바뀌었거나, 아직 등록되지 않은 시설입니다.</p>
      <Link href="/" className="btn-primary btn mt-6">
        홈으로
      </Link>
    </div>
  );
}
