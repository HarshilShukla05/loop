"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";

const links = [
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "vs ManyChat", href: "#compare" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className={`flex w-full max-w-5xl items-center justify-between rounded-full px-3 py-2.5 transition-all duration-300 ${
          scrolled
            ? "border border-line bg-card/80 backdrop-blur-xl ring-soft"
            : "border border-transparent bg-transparent"
        }`}
      >
        <a href="#" className="flex items-center gap-2 pl-2">
          <Logo />
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[14px] text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#pricing"
            className="hidden rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper transition-colors hover:opacity-90 sm:inline-flex"
          >
            Start now
          </a>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/70 md:hidden"
          >
            <div className="space-y-1.5">
              <span
                className={`block h-[1.5px] w-4 bg-ink transition-transform ${
                  open ? "translate-y-[3.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-[1.5px] w-4 bg-ink transition-transform ${
                  open ? "-translate-y-[3.5px] -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-[72px] z-50 w-[calc(100%-2rem)] max-w-5xl rounded-3xl border border-line bg-card/90 p-3 backdrop-blur-xl ring-soft md:hidden"
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-[15px] text-ink hover:bg-paper"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#pricing"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-2xl bg-ink px-4 py-3 text-center text-[15px] font-medium text-paper"
            >
              Start now — ₹200/mo
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
