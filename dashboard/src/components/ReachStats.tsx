import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { api, type Media } from "../api/client";
import type { components } from "../api/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Stats = components["schemas"]["Stats"];
type Window = Stats["window"];

const REFRESH_MS = 30_000;

const windows: { value: Window; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

function rate(sent: number, comments: number): number | null {
  if (comments <= 0) return null;
  return Math.round((sent / comments) * 100);
}

function delta(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function DeltaChip({ value, suffix = "%" }: { value: number | null; suffix?: string }) {
  if (value === null || value === 0) return null;
  return (
    <Badge variant={value > 0 ? "success" : "warning"}>
      {value > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {Math.abs(value)}
      {suffix}
    </Badge>
  );
}

export function ReachStats() {
  const [window_, setWindow] = useState<Window>("7d");
  const [stats, setStats] = useState<Stats | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [thumbs, setThumbs] = useState<Map<string, Media>>(new Map());

  useEffect(() => {
    let active = true;
    const load = () => {
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
          if (active) setUnavailable((u) => u || stats === null);
        });
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
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

  const posts = useMemo(() => {
    if (!stats) return [];
    return [...stats.perPost].sort((a, b) => {
      if (!a.lastEventAt) return 1;
      if (!b.lastEventAt) return -1;
      return new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime();
    });
  }, [stats]);

  if (unavailable) return null;

  const totals = stats?.totals;
  const prev = stats?.previousTotals;
  const replyRate = totals ? rate(totals.sent, totals.comments) : null;
  const prevReplyRate = prev ? rate(prev.sent, prev.comments) : null;

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
        {!totals ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : totals.comments === 0 && posts.length === 0 ? (
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
              <StatTile
                value={totals.comments.toLocaleString()}
                label="Comments caught"
                caption="on posts with an automation"
                chip={<DeltaChip value={delta(totals.comments, prev?.comments)} />}
              />
              <StatTile
                value={totals.sent.toLocaleString()}
                label="DMs delivered"
                caption={totals.failed > 0 ? `${totals.failed} failed — we retry` : "links landed in inboxes"}
                chip={<DeltaChip value={delta(totals.sent, prev?.sent)} />}
                emphasis
              />
              <StatTile
                value={replyRate === null ? "—" : `${replyRate}%`}
                label="Reply rate"
                caption="of comments got your DM"
                chip={
                  <DeltaChip
                    value={
                      replyRate !== null && prevReplyRate !== null ? replyRate - prevReplyRate : null
                    }
                    suffix="pt"
                  />
                }
              />
            </div>

            {posts.length > 0 && (
              <ul className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1">
                {posts.map((post) => {
                  const media = post.mediaId ? thumbs.get(post.mediaId) : undefined;
                  const thumb = media?.thumbnailUrl || media?.mediaUrl;
                  return (
                    <li
                      key={post.mediaId ?? "all-posts"}
                      className="flex items-center gap-4 rounded-xl border border-border p-3"
                    >
                      {thumb ? (
                        <img src={thumb} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-lg text-accent-foreground">
                          {post.mediaId ? "P" : "∞"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="truncate text-sm font-medium text-foreground">
                            {post.mediaId ? (media?.caption?.slice(0, 48) ?? "Post") : "All posts"}
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
                        {/* share of caught comments that got the DM */}
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${post.comments > 0 ? Math.max(3, (post.sent / post.comments) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-4 text-right">
                        <Figure label="comments" value={post.comments} />
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

function StatTile({
  value,
  label,
  caption,
  chip,
  emphasis,
}: {
  value: string;
  label: string;
  caption: string;
  chip: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("font-display text-3xl", emphasis ? "text-primary" : "text-foreground")}>
          {value}
        </span>
        {chip}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{caption}</p>
    </div>
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
