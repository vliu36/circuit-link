import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    domains: ["upload.wikimedia.org"],
  },
};

module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig;
