import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["flexsearch"],
  },
};

export default config;
