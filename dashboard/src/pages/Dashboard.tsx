import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiBaseUrl, type Session } from "../api/client";
import { Pill, type Tone } from "../components/Pill";
import { ReconnectBanner } from "../components/ReconnectBanner";

const statusTone: Record<NonNullable<Session["connection"]>["status"], Tone> = {
  connected: "good",
  token_expired: "warn",
  disconnected: "warn",
  error: "bad",
};

const subscriptionTone: Record<NonNullable<Session["connection"]>["subscriptionStatus"], Tone> = {
  active: "good",
  pending: "warn",
  failed: "bad",
};

export function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  const logout = async () => {
    await api.POST("/auth/logout");
    navigate("/");
  };

  const reconnect = () => window.location.assign(`${apiBaseUrl}/auth/instagram`);

  if (loading) return <Centered>Loading…</Centered>;
  if (!session) return null;

  const { connection } = session;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <span className="text-lg font-semibold text-neutral-900">Loop</span>
        <button onClick={logout} className="text-sm text-neutral-500 hover:text-neutral-800">
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {connection?.subscriptionStatus === "pending" && <ReconnectBanner onReconnect={reconnect} />}

        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-medium text-neutral-500">Connected account</h2>
          {connection ? (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-orange-500 text-lg font-semibold text-white">
                {connection.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-900">@{connection.username}</p>
                <p className="text-sm capitalize text-neutral-500">{connection.platform}</p>
              </div>
              <div className="flex gap-2">
                <Pill label={connection.status} tone={statusTone[connection.status]} />
                <Pill label={connection.subscriptionStatus} tone={subscriptionTone[connection.subscriptionStatus]} />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">No account connected.</p>
          )}
        </section>

        <section className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-medium text-neutral-900">No automations yet</p>
          <p className="mt-1 text-sm text-neutral-500">Create your first keyword → DM rule. Coming soon.</p>
        </section>
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-neutral-500">{children}</div>;
}
