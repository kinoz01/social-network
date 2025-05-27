import type { NextConfig } from "next";

const isFly = process.env.FLY_APP_NAME !== undefined; // Detect if running on Fly.io
const isDocker = process.env.DOCKER === "true"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  /* config options here */
  env: {
    // This is what the BROWSER sees
    NEXT_PUBLIC_API_URL: process.env.DOCKER
      ? "http://localhost:8080"
      : isFly
        ? "https://myflywebsite.com"
        : "http://localhost:8080",

    // This is what the BROWSER sees (for websockets)
    NEXT_PUBLIC_WS_URL: process.env.DOCKER
      ? "ws://localhost:8080"
      : isFly
        ? "wss://yourdomain.com"
        : "ws://localhost:8080",

    // This is what SERVER CODE uses (SSR, API routes)
    INTERNAL_API_URL: process.env.DOCKER
      ? "http://backend:8080"
      : isFly
        ? "https://myflywebsite.com"
        : "http://localhost:8080",
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
      {
        protocol: "http",
        hostname: "backend", // For Docker internal communication
      },
    ],
  },
};

export default nextConfig;
