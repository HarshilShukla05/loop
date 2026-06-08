import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

export type Session = components["schemas"]["Session"];
export type Connection = components["schemas"]["Connection"];
export type Rule = components["schemas"]["Rule"];
export type Media = components["schemas"]["Media"];

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const api = createClient<paths>({
  baseUrl: apiBaseUrl,
  credentials: "include",
  headers: { "ngrok-skip-browser-warning": "true" },
});
