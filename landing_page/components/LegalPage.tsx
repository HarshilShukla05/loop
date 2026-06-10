import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const SUPPORT_EMAIL = "harshilshukla0502@gmail.com"; // TODO: move to support@<final-domain>

export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-serif text-2xl lowercase">
            loop<span className="text-coral">.</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <Link href="/data-deletion" className="transition-colors hover:text-ink">
              Data deletion
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Last updated: {updated}
        </p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 text-lg leading-relaxed text-muted">{intro}</p>}
        <div className="legal-body mt-10">{children}</div>

        <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
          Questions? Write to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-coral hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </footer>
      </article>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink/80">{children}</div>
    </section>
  );
}
