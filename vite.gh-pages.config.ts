// 专用于 GitHub Pages 静态部署的 Vite 配置
// 绕过 vinext / Cloudflare Workers 工具链，直接输出纯静态站点
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  // 如果仓库名不是根路径，需要设置 base（仓库名为 game-ledger）
  base: "/game-ledger/",
  root: ".",
  build: {
    outDir: "dist-gh",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
    },
  },
});
