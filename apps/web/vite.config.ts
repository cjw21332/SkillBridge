import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SkillBridge",
        short_name: "SkillBridge",
        description: "Teach one, learn one.",
        theme_color: "#3D5AFE",
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
      }
    }),
  ],
  server: {
    port: 5173,
    strictPort: false,
  },
});
