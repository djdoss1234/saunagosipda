import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-serif text-3xl">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">주소가 바뀌었거나, 아직 등록되지 않은 시설입니다.</p>
      <Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[var(--ember)] px-5 text-sm font-semibold text-white">
        홈으로
      </Link>
    </div>
  );
}
