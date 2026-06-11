import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCheck, Clock, MessageCircle, TriangleAlert } from "lucide-react";
import { api } from "../api/client";
import type { components } from "../api/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActivityItem = components["schemas"]["ActivityItem"];

const POLL_MS = 8000;

const statusBadge: Record<ActivityItem["status"], { label: string; variant: "success" | "warning" | "destructive" }> = {
  sent: { label: "Sent", variant: "success" },
  queued: { label: "Sending…", variant: "warning" },
  failed: { label: "Failed", variant: "destructive" },
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const timer = useRef<number | null>(null);

  const load = useCallback(() => {
    api
      .GET("/activity", { params: { query: { limit: 25 } } })
      .then(({ data, response }) => {
        if (response.status === 200 && data) {
          setItems(data.items);
          setUnavailable(false);
        } else if (response.status === 404 || response.status === 501) {
          // backend predates the endpoint — hide the card rather than error
          setUnavailable(true);
        }
      })
      .catch(() => {
        if (items === null) setUnavailable(true);
      });
  }, [items]);

  useEffect(() => {
    load();
    timer.current = window.setInterval(load, POLL_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (unavailable) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <span className="text-xs text-muted-foreground">updates live</span>
      </CardHeader>
      <CardContent>
        {items === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-input px-6 py-8 text-center">
            <MessageCircle className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing yet. When someone comments your keyword, you'll see the DM land here within
              seconds.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const badge = statusBadge[item.status];
              const who = item.commenterUsername ? `@${item.commenterUsername}` : "Someone";
              return (
                <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{who}</span>{" "}
                      {item.matchedKeyword ? (
                        <>
                          commented{" "}
                          <Badge variant="accent" className="align-middle">
                            {item.matchedKeyword}
                          </Badge>
                        </>
                      ) : (
                        "commented on your post"
                      )}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                      {item.status === "sent" ? (
                        <CheckCheck className="size-3.5 shrink-0 text-success" />
                      ) : item.status === "failed" ? (
                        <TriangleAlert className="size-3.5 shrink-0 text-destructive" />
                      ) : (
                        <Clock className="size-3.5 shrink-0 text-warning" />
                      )}
                      <span className="truncate">DM: “{item.message}”</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(item.sentAt ?? item.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
