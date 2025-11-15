import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    // -------- DEPRECATED --------
    // domains: [
    //   "upload.wikimedia.org",               // Default profile picture
    //   "firebasestorage.googleapis.com",     // Firebase Storage
    //   "lh3.googleusercontent.com"


    // ],         // Google User Content
    remotePatterns: [
      {
        // Pattern for Google profile pictures
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        // Pattern for Firebase Storage
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '**',
      },
      {
        // Pattern for Wikimedia images
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '**',
      },
      {
        // Pattern for Google Cloud Storage public URLs
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '**',
      }
    ],
  },
};

export default nextConfig;
