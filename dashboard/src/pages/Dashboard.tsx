import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus } from "lucide-react";
import { api, apiBaseUrl, type Rule, type Session } from "../api/client";
import { ReconnectBanner } from "../components/ReconnectBanner";
import { AutomationCard } from "../components/AutomationCard";
import { RuleEditor } from "../components/RuleEditor";
import { ActivityFeed } from "../components/ActivityFeed";
import { DangerZone } from "../components/DangerZone";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Connection = NonNullable<Session["connection"]>;

const statusLabel: Record<Connection["status"], { label: string; variant: "success" | "warning" | "destructive" }> = {
  connected: { label: "Connected", variant: "success" },
  token_expired: { label: "Token expired", variant: "warning" },
  disconnected: { label: "Disconnected", variant: "warning" },
  error: { label: "Error", variant: "destructive" },
};

const subscriptionLabel: Record<
  Connection["subscriptionStatus"],
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  active: { label: "Listening for comments", variant: "success" },
  pending: { label: "Activation pending", variant: "warning" },
  failed: { label: "Activation failed", variant: "destructive" },
};

export function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .GET("/me")
      .then(({ data, response }) => {
        if (!active) return;
        if (response.status === 401 || !data) {
          navigate("/");
          return;
        }
        setSession(data);
      })
      .catch(() => {
        if (active) navigate("/");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const loadRules = useCallback(() => {
    api
      .GET("/rules")
      .then(({ data, response }) => {
        if (response.status === 200 && data) setRules(data.items);
      })
      .catch(() => setRules([]));
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const logout = async () => {
    await api.POST("/auth/logout");
    navigate("/");
  };

  const reconnect = () => window.location.assign(`${apiBaseUrl}/auth/instagram`);

  if (loading) return <Centered>Loading…</Centered>;
  if (!session) return null;

  const { connection } = session;
  const activeRules = rules?.filter((r) => r.status === "active").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Wordmark />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="size-3.5" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div>
          <h1 className="font-display text-3xl text-foreground">
            {connection ? `Hi, @${connection.username}` : "Welcome"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rules && rules.length > 0
              ? `${activeRules} active automation${activeRules === 1 ? "" : "s"} watching your comments.`
              : "Set up your first comment-to-DM automation below."}
          </p>
        </div>

        {connection?.subscriptionStatus === "pending" && <ReconnectBanner onReconnect={reconnect} />}

        <Card>
          <CardHeader>
            <CardTitle>Connected account</CardTitle>
          </CardHeader>
          <CardContent>
            {connection ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-accent font-display text-xl text-accent-foreground">
                  {connection.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">@{connection.username}</p>
                  <p className="text-sm capitalize text-muted-foreground">{connection.platform}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusLabel[connection.status].variant}>
                    {statusLabel[connection.status].label}
                  </Badge>
                  <Badge variant={subscriptionLabel[connection.subscriptionStatus].variant}>
                    {subscriptionLabel[connection.subscriptionStatus].label}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No account connected.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automations</CardTitle>
            <Button size="sm" onClick={() => setEditing(true)}>
              <Plus className="size-3.5" />
              New automation
            </Button>
          </CardHeader>
          <CardContent>
            {rules === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : rules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-input px-8 py-12 text-center">
                <p className="font-display text-xl text-foreground">No automations yet</p>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                  Pick a post, choose a keyword, and we'll DM the link the moment someone comments
                  it.
                </p>
                <Button className="mt-6" onClick={() => setEditing(true)}>
                  <Plus className="size-4" />
                  Create your first automation
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <AutomationCard key={rule.id} rule={rule} onDeleted={loadRules} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ActivityFeed />

        <DangerZone />
      </main>

      {editing && (
        <RuleEditor
          onClose={() => setEditing(false)}
          onCreated={() => {
            setEditing(false);
            loadRules();
          }}
        />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      {children}
    </div>
  );
}
