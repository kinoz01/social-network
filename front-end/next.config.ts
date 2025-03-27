import type { NextConfig } from "next";

const isDocker = process.env.DOCKERIZED === "true"; // Detect if running inside Docker
const isFly = process.env.FLY_APP_NAME !== undefined; // Detect if running on Fly.io

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: isFly
      ? "https://mywebsite.com" // Fly.io uses production API
      : isDocker
      ? "http://backend:8080" // Inside Docker, use service name
      : "http://localhost:8080", // Local development
  },
};

export default nextConfig;
