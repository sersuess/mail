import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Work around a locked `.next/dev/trace` file on Windows.
  distDir: ".next-cache",
};

export default nextConfig;
