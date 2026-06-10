"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/**
 * Looping mock of loop's core flow:
 * comment lands → keyword matched → follow checked → DM auto-sent + email captured.
 */
const STEPS = [
  { ms: 900, label: "Listening for keyword" },
  { ms: 1100, label: "Keyword “LINK” matched" },
  { ms: 1100, label: "Follow verified" },
  { ms: 1600, label: "DM sent + email captured" },
] as const;

export default function ChatDemo() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce) {
      setStep(3);
      return;
    }
    const t = setTimeout(
      () => setStep((s) => (s + 1) % STEPS.length),
      STEPS[step].ms
    );
    return () => clearTimeout(t);
  }, [step, reduce]);

  return (
    <div className="relative">
      {/* floating status pill */}
      <div className="absolute -top-5 left-1/2 z-20 -translate-x-1/2">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-[12.5px] font-medium text-ink ring-soft"
          >
            <span
              className={`flex h-1.5 w-1.5 rounded-full ${
                step === 3 ? "bg-emerald-500" : "bg-gradient-ig"
              } ${step < 3 ? "animate-pulse" : ""}`}
            />
            {STEPS[step].label}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        animate={reduce ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="overflow-hidden rounded-[28px] border border-line bg-card ring-lift"
      >
        {/* post header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <div className="h-9 w-9 rounded-full bg-gradient-ig p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-[13px] font-semibold">
              🎬
            </div>
          </div>
          <div className="leading-tight">
            <p className="text-[14px] font-semibold text-ink">@yourhandle</p>
            <p className="text-[12px] text-muted">Reel · New drop is live 🔥</p>
          </div>
          <span className="ml-auto text-muted">•••</span>
        </div>

        {/* "media" */}
        <div className="relative h-36 bg-[linear-gradient(120deg,var(--coral-soft),var(--paper),var(--card))]">
          <div className="absolute inset-0 grain opacity-60" />
          <div className="absolute bottom-3 left-4 rounded-full bg-card/80 px-3 py-1 text-[12px] font-medium text-ink backdrop-blur">
            Comment <span className="text-gradient font-semibold">LINK</span> for
            the freebie 👇
          </div>
        </div>

        {/* comment + dm thread */}
        <div className="space-y-3 px-5 py-4">
          {/* incoming comment */}
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 shrink-0 rounded-full bg-paper text-center text-[13px] leading-7">
              🙋
            </div>
            <div>
              <p className="text-[13px] font-semibold text-ink">
                priya.creates
              </p>
              <p className="text-[14px] text-ink">Send me the LINK 👀</p>
            </div>
          </div>

          {/* loop reply */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex items-start justify-end gap-2.5"
              >
                <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-coral px-3.5 py-2.5 text-white">
                  <p className="text-[12px] font-medium text-white/75">
                    Auto-DM from loop
                  </p>
                  <p className="mt-0.5 text-[14px] leading-snug">
                    Hey Priya! Here&apos;s your freebie 🎁 → loop.so/drop
                  </p>
                  <p className="mt-1.5 text-[12px] text-white/65">
                    ✓ Delivered · email saved to list
                  </p>
                </div>
                <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-ig p-[2px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-[12px]">
                    ∞
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* footer counter */}
        <div className="flex items-center justify-between border-t border-line px-5 py-3">
          <span className="text-[12.5px] text-muted">DMs sent today</span>
          <Counter active={step >= 3} />
        </div>
      </motion.div>
    </div>
  );
}

function Counter({ active }: { active: boolean }) {
  const [n, setN] = useState(1248);
  useEffect(() => {
    if (active) setN((v) => v + 1);
  }, [active]);
  return (
    <span className="tabular-nums text-[14px] font-semibold text-ink">
      {n.toLocaleString("en-IN")}
    </span>
  );
}
