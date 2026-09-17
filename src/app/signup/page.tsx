import { AuthForm } from "@/components/AuthForm";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-sm text-[var(--muted)]">가입 준비 중…</p>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
