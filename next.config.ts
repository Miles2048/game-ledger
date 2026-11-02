import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",   // 静态导出，兼容 GitHub Pages
  trailingSlash: true, // 确保路径以 / 结尾，避免 404
  images: {
    unoptimized: true, // GitHub Pages 不支持 Next.js Image Optimization
  },
};

export default nextConfig;
