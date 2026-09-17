import { BottomNav } from "@/components/BottomNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Providers } from "@/components/Providers";
import { siteOrigin } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Noto_Serif_KR({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const siteUrl = siteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "사우나고싶다",
    template: "%s · 사우나고싶다",
  },
  description:
    "전국 목욕장업 영업중 목록. 가고싶어요와 방문 기록.",
  openGraph: {
    locale: "ko_KR",
    type: "website",
    siteName: "사우나고싶다",
    url: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f0e1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col pb-[4.75rem] md:pb-0">
        <a href="#main" className="skip-link">
          본문으로 건너뛰기
        </a>
        <Providers>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
