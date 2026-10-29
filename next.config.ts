import type { NextConfig } from "next";

// GitHub Pages serves the site under /<repo>, so the build sets NEXT_PUBLIC_BASE_PATH=/rega-app.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
