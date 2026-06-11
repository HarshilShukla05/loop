import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, apiBaseUrl } from "../api/client";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";

const landingUrl = import.meta.env.VITE_LANDING_URL ?? "https://loop.so";

const defaultLegal = {
  privacyUrl: `${landingUrl}/privacy`,
  termsUrl: `${landingUrl}/terms`,
  dataDeletionUrl: `${landingUrl}/data-deletion`,
};

// Friendly copy for the ?error= codes the OAuth callback can redirect with.
const oauthErrors: Record<string, { title: string; body: string }> = {
  access_denied: {
    title: "Connection cancelled",
    body: "Loop needs all three permissions on the Instagram consent screen to work — they let us see your posts, spot keyword comments, and send your reply. Nothing happens without your approval, and you can disconnect anytime.",
  },
  not_professional: {
    title: "Professional account needed",
    body: "Loop works with Instagram Business or Creator accounts. Switch in Instagram under Settings → Account type and tools, then connect again — it's free and takes a minute.",
  },
  exchange_failed: {
    title: "Instagram didn't complete the connection",
    body: "Something went wrong on Instagram's side while connecting. Please try again in a moment.",
  },
  connect_failed: {
    title: "We couldn't finish setting up",
    body: "Your Instagram login worked, but saving the connection failed on our side. Please try again — if it keeps happening, email us.",
  },
};

const fallbackError = {
  title: "Connection didn't go through",
  body: "Something interrupted the Instagram connection. Please try again.",
};

export function Login() {
  const [legal, setLegal] = useState(defaultLegal);
  const [params] = useSearchParams();
  const deleted = params.get("deleted") === "1";
  const errorCode = params.get("error");
  const oauthError = errorCode ? (oauthErrors[errorCode] ?? fallbackError) : null;

  useEffect(() => {
    let active = true;
    api
      .GET("/config")
      .then(({ data, response }) => {
        if (active && response.status === 200 && data) setLegal(data);
      })
      .catch(() => {
        // keep the build-time fallback links
      });
    return () => {
      active = false;
    };
  }, []);

  const connect = () => window.location.assign(`${apiBaseUrl}/auth/instagram`);

  return (
    <main className="relative flex min-h-screen flex-col bg-background px-6">
      <header className="flex items-center justify-between py-6">
        <Wordmark />
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center pb-24">
        <div className="w-full max-w-md text-center">
          {deleted && (
            <p className="mb-8 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Your account and all stored data have been deleted. You can reconnect anytime.
            </p>
          )}
          {oauthError && (
            <div className="mb-8 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-left">
              <p className="text-sm font-medium text-warning">{oauthError.title}</p>
              <p className="mt-1 text-sm text-warning/90">{oauthError.body}</p>
            </div>
          )}
          <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
            Turn comments into conversations
          </h1>
          <p className="mt-4 text-balance text-muted-foreground">
            Auto-DM the right link the moment someone comments your keyword — unlimited, flat
            ₹200/mo.
          </p>
          <Button size="lg" className="mt-10 w-full" onClick={connect}>
            <InstagramIcon className="size-5" />
            Continue with Instagram
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            You'll connect your Instagram Business or Creator account.
          </p>
        </div>
      </div>

      <footer className="flex items-center justify-center gap-6 py-6 text-xs text-muted-foreground">
        <a href={legal.privacyUrl} className="transition-colors hover:text-foreground">
          Privacy policy
        </a>
        <a href={legal.termsUrl} className="transition-colors hover:text-foreground">
          Terms of service
        </a>
        <a href={legal.dataDeletionUrl} className="transition-colors hover:text-foreground">
          Data deletion
        </a>
      </footer>
    </main>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
