const backendOriginFromFly = (process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "").replace(/\/$/, "");

const normalizeWsOrigin = (origin: string) => {
  if (origin.startsWith("https://")) return "wss://" + origin.slice("https://".length);
  if (origin.startsWith("http://")) return "ws://" + origin.slice("http://".length);
  return origin;
};

const fallbackHttp = process.env.BACKEND_URL || "http://localhost:8080";
const fallbackWs = process.env.BACKEND_WS || "ws://localhost:8080";

export const API_URL = backendOriginFromFly || fallbackHttp;
export const API_URL_WS = backendOriginFromFly ? normalizeWsOrigin(API_URL) : fallbackWs;
