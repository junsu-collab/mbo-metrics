import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages는 프로젝트 저장소를 /<repo>/ 하위에 호스팅하므로
// 배포 워크플로에서 BASE_PATH=/<repo>/ 를 주입한다. 로컬 dev는 "/".
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "뉴스디자인팀 MBO Metrics",
        short_name: "MBO Metrics",
        description: "뉴스디자인팀 업무평가 MBO Metrics",
        lang: "ko",
        display: "standalone",
        orientation: "any",
        background_color: "#f7f7f8",
        theme_color: "#0066ff",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        // 정적 산출물 파일명은 해시로 바뀌므로 네트워크 우선 + 오프라인 폴백.
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.method === "GET",
            handler: "NetworkFirst",
            options: { cacheName: "mbo-metrics-runtime" },
          },
        ],
      },
    }),
  ],
});
