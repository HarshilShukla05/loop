import { http, HttpResponse } from "msw";
import type { Session } from "../api/client";
import type { components } from "../api/schema";

type ActivityItem = components["schemas"]["ActivityItem"];

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

  http.get(`${baseUrl}/activity`, () => {
    const now = Date.now();
    const item = (
      overrides: Partial<ActivityItem> & Pick<ActivityItem, "id" | "status">,
      minutesAgo: number,
    ): ActivityItem => ({
      ruleId: "00000000-0000-0000-0000-00000000000a",
      mediaId: "media-1",
      commentId: `comment-${overrides.id}`,
      commenterId: `ig-user-${overrides.id}`,
      commenterUsername: null,
      matchedKeyword: "LINK",
      message: "Here's the guide you asked for 🎁",
      link: "https://example.com/guide",
      createdAt: new Date(now - minutesAgo * 60_000).toISOString(),
      sentAt:
        overrides.status === "sent" ? new Date(now - minutesAgo * 60_000 + 4_000).toISOString() : null,
      ...overrides,
    });
    return HttpResponse.json({
      items: [
        item({ id: "00000000-0000-0000-0000-0000000000a1", status: "queued", commenterUsername: "priya.creates" }, 0),
        item({ id: "00000000-0000-0000-0000-0000000000a2", status: "sent", commenterUsername: "arjun.fit" }, 2),
        item({ id: "00000000-0000-0000-0000-0000000000a3", status: "sent" }, 14),
        item({ id: "00000000-0000-0000-0000-0000000000a4", status: "failed", commenterUsername: "meme.lord", matchedKeyword: null }, 47),
        item({ id: "00000000-0000-0000-0000-0000000000a5", status: "sent", commenterUsername: "kavya.codes" }, 180),
      ],
    });
  }),
];
