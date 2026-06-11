import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { api, type Media } from "../api/client";
import type { components } from "../api/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Stats = components["schemas"]["Stats"];
type Window = Stats["window"];

const windows: { value: Window; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

function pct(part: number, whole: number): string | null {
  if (whole <= 0) return null;
  return `${Math.round((part / whole) * 100)}%`;
}

function delta(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function ReachStats() {
  const [window_, setWindow] = useState<Window>("7d");
  const [stats, setStats] = useState<Stats | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [thumbs, setThumbs] = useState<Map<string, Media>>(new Map());

  useEffect(() => {
    let active = true;
    api
      .GET("/stats", { params: { query: { window: window_ } } })
      .then(({ data, response }) => {
        if (!active) return;
        if (response.status === 200 && data) {
          setStats(data);
          setUnavailable(false);
        } else if (response.status === 404 || response.status === 501) {
          setUnavailable(true); // backend predates the endpoint
        }
      })
      .catch(() => {
        if (active && stats === null) setUnavailable(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window_]);

  useEffect(() => {
    api
      .GET("/media")
      .then(({ data, response }) => {
        if (response.status === 200 && data) {
          setThumbs(new Map(data.items.map((m) => [m.id, m])));
        }
      })
      .catch(() => {
        // thumbnails are decoration; rows fall back to a placeholder
      });
  }, []);

  const tiles = useMemo(() => {
    if (!stats) return null;
    const { totals, previousTotals } = stats;
    return [
      {
        label: "Comments caught",
        value: totals.comments,
        delta: delta(totals.comments, previousTotals?.comments),
        caption: "on posts with an automation",
      },
      {
        label: "Matched your keyword",
        value: totals.matched,
        delta: delta(totals.matched, previousTotals?.matched),
        caption: pct(totals.matched, totals.comments)
          ? `${pct(totals.matched, totals.comments)} of comments`
          : "eligible for a DM",
      },
      {
        label: "DMs delivered",
        value: totals.sent,
        delta: delta(totals.sent, previousTotals?.sent),
        caption: pct(totals.sent, totals.matched)
          ? `${pct(totals.sent, totals.matched)} delivery rate`
          : "links landed in inboxes",
      },
    ];
  }, [stats]);

  if (unavailable) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your reach</CardTitle>
        <div className="flex rounded-lg border border-border p-0.5">
          {windows.map((w) => (
            <button
              key={w.value}
              onClick={() => setWindow(w.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                window_ === w.value
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {stats === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : stats.totals.comments === 0 && stats.perPost.length === 0 ? (
          <div className="rounded-xl border border-dashed border-input px-6 py-10 text-center">
            <p className="font-display text-xl text-foreground">Your reach shows up here</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Once an automation is live, you'll see every comment it catches and every DM it
              delivers — even while you sleep.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {tiles!.map((tile) => (
                <div key={tile.label} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-3xl text-foreground">
                      {tile.value.toLocaleString()}
                    </span>
                    {tile.delta !== null && tile.delta !== 0 && (
                      <Badge variant={tile.delta > 0 ? "success" : "warning"}>
                        {tile.delta > 0 ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {Math.abs(tile.delta)}%
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">{tile.label}</p>
                  <p className="text-xs text-muted-foreground">{tile.caption}</p>
                </div>
              ))}
            </div>

            {stats.perPost.length > 0 && (
              <ul className="mt-5 space-y-3">
                {stats.perPost.map((post) => {
                  const media = post.mediaId ? thumbs.get(post.mediaId) : undefined;
                  const thumb = media?.thumbnailUrl || media?.mediaUrl;
                  return (
                    <li
                      key={post.mediaId ?? "all-posts"}
                      className="flex items-center gap-4 rounded-xl border border-border p-3"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="size-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-lg text-accent-foreground">
                          {post.mediaId ? "P" : "∞"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium text-foreground">
                            {post.mediaId
                              ? (media?.caption?.slice(0, 40) ?? "Post")
                              : "All posts"}
                          </span>
                          {post.keywords.length === 0 ? (
                            <span className="text-xs text-muted-foreground">any comment</span>
                          ) : (
                            post.keywords.map((k) => (
                              <Badge key={k} variant="accent">
                                {k}
                              </Badge>
                            ))
                          )}
                        </div>
                        {/* funnel: comments -> matched -> sent */}
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary/30"
                            style={{
                              width: `${post.comments > 0 ? Math.max(4, (post.matched / post.comments) * 100) : 0}%`,
                            }}
                          >
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${post.matched > 0 ? (post.sent / post.matched) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-4 text-right">
                        <Figure label="comments" value={post.comments} />
                        <Figure label="matched" value={post.matched} />
                        <Figure label="DMs sent" value={post.sent} emphasis />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Figure({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div>
      <p className={cn("font-display text-lg", emphasis ? "text-primary" : "text-foreground")}>
        {value.toLocaleString()}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
