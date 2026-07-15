/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  server: {
    port: 3000, // 指定端口
    open: true, // 启动自动打开浏览器
    strictPort: true, // 【可选】端口被占用时直接报错，不会自动换端口
  },
});
