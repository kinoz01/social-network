const isFly = process.env.FLY_APP_NAME || process.env.NEXT_PUBLIC_FLY_APP_NAME; // one for server, other for client
export const API_URL = isFly ? "https://socnet.fly.dev" : process.env.BACKEND_URL || "http://localhost:8080";
export const API_URL_WS = isFly ? "wss://socnet.fly.dev" : process.env.BACKEND_WS || "ws://localhost:8080";