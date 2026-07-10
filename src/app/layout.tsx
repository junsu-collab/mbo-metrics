import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { StoreProvider } from "@/components/StoreProvider";
import { Toast } from "@/components/shared/Toast";

export const metadata: Metadata = {
  title: "MBO Metrics",
  description: "뉴스디자인팀 업무평가 MBO Metrics",
  manifest: "manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MBO Metrics",
  },
  icons: {
    apple: "icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0066ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard — Montage 디자인 시스템이 사용하는 폰트 (공식 CDN 배포본) */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/static/pretendard-dynamic-subset.min.css"
        />
      </head>
      <body>
        <StoreProvider>{children}</StoreProvider>
        <Toast />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
