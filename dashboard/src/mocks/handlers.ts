import { http, HttpResponse } from "msw";
import type { Session } from "../api/client";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

// Drive states from a ?mock= query param: "loggedOut" | "pending" | (default active).
function scenario(): string | null {
  return new URLSearchParams(window.location.search).get("mock");
}

export const handlers = [
  http.get(`${baseUrl}/me`, () => {
    if (scenario() === "loggedOut") {
      return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const session: Session = {
      user: { id: "00000000-0000-0000-0000-000000000001" },
      connection: {
        platform: "instagram",
        username: "creator.handle",
        status: "connected",
        subscriptionStatus: scenario() === "pending" ? "pending" : "active",
      },
    };
    return HttpResponse.json(session);
  }),

  http.post(`${baseUrl}/auth/logout`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${baseUrl}/config`, () =>
    HttpResponse.json({
      privacyUrl: "http://localhost:3000/privacy",
      termsUrl: "http://localhost:3000/terms",
      dataDeletionUrl: "http://localhost:3000/data-deletion",
    }),
  ),

  http.delete(`${baseUrl}/me`, () => new HttpResponse(null, { status: 204 })),
];
