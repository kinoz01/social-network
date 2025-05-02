import type { NextConfig } from "next";

const isFly = process.env.FLY_APP_NAME !== undefined; // Detect if running on Fly.io

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: isFly
      ? "https://myflywebsite.com"  // Fly.io uses production API
      : "http://localhost:8080", // Local development
  },
  images: {
    domains: ["https://myflywebsite.com", "localhost"], // or whatever NGINX/proxy domain serves your images
  },
};

export default nextConfig;
