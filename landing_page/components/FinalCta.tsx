"use client";

import { motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import MagneticButton from "@/components/ui/MagneticButton";

export default function FinalCta() {
  return (
    <section className="relative px-4 pb-10">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="grain relative overflow-hidden rounded-[40px] border border-line bg-ink px-6 py-20 text-center sm:py-28">
            {/* gradient blooms */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-1/2 h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(232,93,61,0.45),transparent)] blur-2xl" />
              <div className="absolute bottom-0 right-10 h-[300px] w-[300px] rounded-full bg-[radial-gradient(closest-side,rgba(232,162,61,0.35),transparent)] blur-2xl" />
            </div>

            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="mx-auto max-w-3xl text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.02] tracking-tightest text-paper"
              >
                Your next viral reel is coming.{" "}
                <span className="serif-italic animate-shimmer bg-[linear-gradient(90deg,#E85D3D,#C2402A,#E8A23D,#E85D3D)] bg-[length:200%_auto] bg-clip-text text-transparent">
                  Be ready to catch it.
                </span>
              </motion.h2>
              <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-paper/70">
                Set up loop once and turn every comment into a DM, a follower,
                and an email — at a flat ₹200/month, forever.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <MagneticButton
                  href="#pricing"
                  className="!bg-paper !text-ink hover:!bg-white"
                >
                  Start now — ₹200/mo
                  <span aria-hidden>→</span>
                </MagneticButton>
                <a
                  href="#how"
                  className="rounded-full border border-white/20 px-7 py-3.5 text-[15px] font-medium text-paper/90 transition-colors hover:bg-white/5"
                >
                  See how it works
                </a>
              </div>
              <p className="mt-6 text-[13.5px] text-paper/50">
                Unlimited comments · Unlimited DMs · No viral penalty
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
