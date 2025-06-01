export const API_URL = process.env.FLY_APP_NAME ? "https://myflywebsite.com" : process.env.BACKEND_URL || "http://localhost:8080";

export const API_URL_WS = process.env.FLY_APP_NAME ? "wss://myflywebsite.com" : process.env.BACKEND_WS || "ws://localhost:8080";