import type { NextConfig } from "next";

const repoBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: repoBasePath,
  images: { unoptimized: true },
};

export default nextConfig;
