import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Plus } from "lucide-react";
import { api, apiBaseUrl, type Rule, type Session } from "../api/client";
import { ReconnectBanner } from "../components/ReconnectBanner";
import { AutomationCard } from "../components/AutomationCard";
import { RuleEditor } from "../components/RuleEditor";
import { ReachStats } from "../components/ReachStats";
import { DangerZone } from "../components/DangerZone";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Connection = NonNullable<Session["connection"]>;
type Tab = "reach" | "automations";

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
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [editing, setEditing] = useState(false);
  // URL-backed tabs: each tab is a route, so views are linkable and the
  // back button works; promoting a tab to a full page later is free.
  const tab: Tab = location.pathname.endsWith("/automations") ? "automations" : "reach";
  const setTab = (next: Tab) =>
    navigate(next === "automations" ? "/dashboard/automations" : "/dashboard");

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

        {/* compact account strip */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          {connection ? (
            <>
              <div className="flex size-8 items-center justify-center rounded-full bg-accent font-display text-sm text-accent-foreground">
                {connection.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">@{connection.username}</span>
              <span className="text-sm capitalize text-muted-foreground">{connection.platform}</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Badge variant={statusLabel[connection.status].variant}>
                  {statusLabel[connection.status].label}
                </Badge>
                <Badge variant={subscriptionLabel[connection.subscriptionStatus].variant}>
                  {subscriptionLabel[connection.subscriptionStatus].label}
                </Badge>
              </div>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No account connected.</span>
          )}
        </div>

        {/* section tabs */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex rounded-xl border border-border bg-card p-1">
            <TabButton active={tab === "reach"} onClick={() => setTab("reach")}>
              Your reach
            </TabButton>
            <TabButton active={tab === "automations"} onClick={() => setTab("automations")}>
              Automations{rules && rules.length > 0 ? ` · ${rules.length}` : ""}
            </TabButton>
          </div>
          {tab === "automations" && (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Plus className="size-3.5" />
              New automation
            </Button>
          )}
        </div>

        {tab === "reach" ? (
          <ReachStats />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Automations</CardTitle>
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
        )}

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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      {children}
    </div>
  );
}
