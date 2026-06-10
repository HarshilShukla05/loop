"use client";

import { motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import MagneticButton from "@/components/ui/MagneticButton";

const INCLUDED = [
  "Unlimited keyword triggers",
  "Unlimited comments captured",
  "Unlimited DMs sent",
  "Follow-gating",
  "Email capture + export",
  "Posts, Reels & Stories",
  "DM activity history",
  "UPI, cards & global payments",
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative bg-card/40 px-4 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              One plan. One price.{" "}
              <span className="serif-italic text-gradient">No tiers.</span>
            </>
          }
          subtitle="The whole point of loop is that you never get a surprise bill for growing. This is it."
        />

        <Reveal className="mx-auto mt-14 max-w-md">
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="relative overflow-hidden rounded-[32px] border border-line bg-card p-1.5 ring-lift"
          >
            {/* gradient top edge */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-ig" />

            <div className="rounded-[26px] p-8">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-line bg-paper px-3 py-1 text-[12.5px] font-medium uppercase tracking-[0.12em] text-ink">
                  loop · everything
                </span>
                <span className="rounded-full bg-gradient-ig px-3 py-1 text-[12px] font-semibold text-white">
                  Founding price
                </span>
              </div>

              <div className="mt-7 flex items-end gap-2">
                <span className="text-[56px] font-semibold leading-none tracking-tightest text-ink">
                  ₹200
                </span>
                <span className="mb-2 text-[16px] text-muted">/month</span>
              </div>
              <p className="mt-1.5 text-[14px] text-muted">
                ≈ $2.50/mo · billed monthly · cancel anytime
              </p>

              <div className="my-7 h-px bg-line" />

              <ul className="space-y-3">
                {INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-[15px] text-ink"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-ig text-[11px] text-white">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <MagneticButton
                  href="#"
                  variant="primary"
                  className="w-full"
                >
                  Start now — ₹200/mo
                  <span aria-hidden>→</span>
                </MagneticButton>
              </div>
              <p className="mt-4 text-center text-[13px] text-muted">
                No card games. No scaling penalty. Just reach.
              </p>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
