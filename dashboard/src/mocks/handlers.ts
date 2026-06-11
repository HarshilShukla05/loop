import { http, HttpResponse } from "msw";
import type { Session } from "../api/client";
import type { components } from "../api/schema";

type Stats = components["schemas"]["Stats"];
type Window = Stats["window"];

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

  http.get(`${baseUrl}/stats`, ({ request }) => {
    const window = (new URL(request.url).searchParams.get("window") ?? "7d") as Window;
    // scale demo numbers by window so switching feels real
    const scale = { today: 1, "7d": 7, "30d": 26, all: 60 }[window];
    const stats: Stats = {
      window,
      totals: {
        comments: 38 * scale,
        matched: 31 * scale,
        sent: 30 * scale,
        failed: scale,
      },
      previousTotals:
        window === "all"
          ? null
          : { comments: 29 * scale, matched: 22 * scale, sent: 21 * scale, failed: scale },
      perPost: [
        {
          mediaId: "media-1",
          keywords: ["LINK"],
          comments: 26 * scale,
          matched: 22 * scale,
          sent: 21 * scale,
          lastEventAt: new Date(Date.now() - 4 * 60_000).toISOString(),
        },
        {
          mediaId: "media-2",
          keywords: ["GUIDE", "EBOOK"],
          comments: 9 * scale,
          matched: 7 * scale,
          sent: 7 * scale,
          lastEventAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
        },
        {
          mediaId: null,
          keywords: [],
          comments: 3 * scale,
          matched: 2 * scale,
          sent: 2 * scale,
          lastEventAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
        },
      ],
    };
    return HttpResponse.json(stats);
  }),

  http.get(`${baseUrl}/media`, () =>
    HttpResponse.json({
      items: [
        { id: "media-1", caption: "5 hooks that doubled my reach", mediaType: "REEL" },
        { id: "media-2", caption: "My exact content system (free guide)", mediaType: "IMAGE" },
      ],
    }),
  ),
];
