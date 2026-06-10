"use client";

import { motion, useReducedMotion } from "framer-motion";
import MagneticButton from "@/components/ui/MagneticButton";
import ChatDemo from "@/components/ChatDemo";

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="grain relative overflow-hidden px-4 pb-20 pt-36 sm:pt-44">
      {/* soft ambient gradient blooms */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(232,93,61,0.12),transparent)] blur-2xl" />
        <div className="absolute right-[8%] top-40 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(232,162,61,0.10),transparent)] blur-2xl" />
        <div className="absolute left-[6%] top-72 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(251,233,226,0.9),transparent)] blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr,0.95fr]">
        {/* Left: copy */}
        <div className="text-center lg:text-left">
          <motion.a
            href="#compare"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="group inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 py-1.5 text-[13px] text-muted backdrop-blur-sm"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-gradient-ig" />
            Instagram DM automation, minus the ManyChat tax
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </motion.a>

          <motion.h1
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05 }}
            className="mt-6 text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-[0.98] tracking-tightest text-ink"
          >
            Turn comments
            <br className="hidden sm:block" /> into DMs.{" "}
            <span className="serif-italic animate-shimmer bg-[linear-gradient(90deg,#E85D3D,#C2402A,#E8A23D,#E85D3D)] bg-[length:200%_auto] bg-clip-text text-transparent">
              Get that reach.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-muted lg:mx-0"
          >
            loop auto-sends your link, code, or freebie the moment someone
            comments your keyword on a post or reel. Follow-gating and email
            capture built in — at a flat{" "}
            <span className="font-medium text-ink">₹200/month</span>,
            unlimited everything.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
          >
            <MagneticButton href="#pricing" variant="primary">
              Start now — ₹200/mo
              <span aria-hidden>→</span>
            </MagneticButton>
            <MagneticButton href="#how" variant="ghost">
              See how it works
            </MagneticButton>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-5 text-[13.5px] text-muted/90"
          >
            No per-contact pricing · No viral penalty · Cancel anytime
          </motion.p>
        </div>

        {/* Right: live demo */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative mx-auto w-full max-w-[420px]"
        >
          <ChatDemo />
        </motion.div>
      </div>
    </section>
  );
}
