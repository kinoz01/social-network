import type { NextConfig } from "next";

const isFly = process.env.FLY_APP_NAME !== undefined; // Detect if running on Fly.io

const nextConfig: NextConfig = {
  reactStrictMode: false,
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: isFly
      ? "https://myflywebsite.com" // Fly.io uses production API
      : "http://localhost:8080", // Local development
    NEXT_PUBLIC_WS_URL: isFly
      ? "wss://yourdomain.com"
      : "ws://localhost:8080",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "myflywebsite.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
