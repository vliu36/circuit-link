import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    domains: [
      "upload.wikimedia.org",               // Default profile picture
      "firebasestorage.googleapis.com",     // Firebase Storage
      "lh3.googleusercontent.com"
    ],         // Google User Content
  },
};

export default nextConfig;
