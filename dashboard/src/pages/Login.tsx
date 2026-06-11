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
};

export function Login() {
  const [legal, setLegal] = useState(defaultLegal);
  const [params] = useSearchParams();
  const deleted = params.get("deleted") === "1";

  useEffect(() => {
    let active = true;
    api
      .GET("/config")
      .then(({ data, response }) => {
        if (active && response.status === 200 && data)
          setLegal({ privacyUrl: data.privacyUrl, termsUrl: data.termsUrl });
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
