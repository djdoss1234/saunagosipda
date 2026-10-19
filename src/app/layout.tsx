import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "사우나고싶다", template: "%s · 사우나고싶다" },
  description: "다녀온 사우나를 바로 기록하세요. 세트·온도·토토노이를 쌓으면 내 루틴이 보여요.",
  appleWebApp: { capable: true, title: "사우나고싶다", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3f5" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// 글꼴: Pretendard(OFL) 가변 동적 서브셋을 CDN에서. 의존성 추가 없이, 실패하면 Apple SD Gothic Neo/Noto Sans KR로 떨어진다.
const PRETENDARD = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={PRETENDARD} crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only">
          본문으로
        </a>
        <Providers>
          <Nav />
          <main id="main" className="mx-auto w-full max-w-lg px-4 pt-1 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
