import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

/** 개발 서버 프록시 기본 대상(배포 백엔드). VITE_PROXY_TARGET으로 바꾼다 */
const DEFAULT_PROXY_TARGET = "https://api.jigeumgayong.site";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = (env.VITE_PROXY_TARGET || DEFAULT_PROXY_TARGET).replace(/\/+$/, "");

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    server: {
      port: 5173,
      proxy: {
        // VITE_API_BASE_URL이 비어 있으면 client.ts가 상대 경로(/api/...)로 호출하고 여기서 백엔드로 넘긴다
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            // 배포 서버 CORS는 www.jigeumgayong.site만 허용한다. 브라우저가 붙이는
            // Origin(localhost)을 지워 서버 간 요청으로 보내야 403이 나지 않는다
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.removeHeader("origin");
            });
          },
        },
      },
    },
  };
});
