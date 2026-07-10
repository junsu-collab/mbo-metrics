import type { Metadata, Viewport } from "next";
import "./globals.css";

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
  themeColor: "#1a36c4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <StoreProvider>{children}</StoreProvider>
        <Toast />
      </body>
    </html>
  );
}
