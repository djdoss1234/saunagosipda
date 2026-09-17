"use client";

import { useApp } from "@/context/AppState";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { login } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/me";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="page-wrap max-w-md space-y-4 py-12 sm:py-16"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !email.includes("@") || password.length < 4) {
          setError("이름, 올바른 이메일, 4자 이상 비밀번호가 필요합니다.");
          return;
        }
        login(name.trim(), email.trim());
        router.push(next);
      }}
    >
      <p className="kicker">Account</p>
      <h1 className="font-serif text-3xl">{mode === "login" ? "로그인" : "회원가입"}</h1>
      <p className="text-sm text-[var(--muted)]">데모 계정입니다. 정보는 이 브라우저에만 저장됩니다.</p>
      <div>
        <label htmlFor="name" className="text-sm font-medium">
          닉네임 <span className="text-[var(--ember)]">*</span>
        </label>
        <input
          id="name"
          autoComplete="nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field mt-1"
        />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          이메일 <span className="text-[var(--ember)]">*</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field mt-1"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호 <span className="text-[var(--ember)]">*</span>
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field pr-20"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 px-2 text-sm text-[var(--muted)]"
            onClick={() => setShow((v) => !v)}
          >
            {show ? "숨기기" : "보기"}
          </button>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-[var(--ember-deep)]" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary btn w-full">
        {mode === "login" ? "들어가기" : "계정 만들기"}
      </button>
    </form>
  );
}
