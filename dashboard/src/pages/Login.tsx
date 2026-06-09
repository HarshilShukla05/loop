import { apiBaseUrl } from "../api/client";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";

export function Login() {
  const connect = () => window.location.assign(`${apiBaseUrl}/auth/instagram`);

  return (
    <main className="relative flex min-h-screen flex-col bg-background px-6">
      <header className="flex items-center justify-between py-6">
        <Wordmark />
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center pb-24">
        <div className="w-full max-w-md text-center">
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
        <a href="/privacy" className="transition-colors hover:text-foreground">
          Privacy policy
        </a>
        <a href="/terms" className="transition-colors hover:text-foreground">
          Terms of service
        </a>
        <a href="/data-deletion" className="transition-colors hover:text-foreground">
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
