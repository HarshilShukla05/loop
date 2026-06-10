"use client";

import { motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const STEPS = [
  {
    n: "01",
    title: "Pick your keyword",
    body: "Tell loop the word to watch for — “LINK”, “GUIDE”, a discount code, anything. Set it once per post or reel.",
    chip: "Comment LINK 👀",
  },
  {
    n: "02",
    title: "Gate it on a follow",
    body: "loop checks if the commenter follows you first. Non-followers get a friendly nudge to follow, then the drop.",
    chip: "Follow verified ✓",
  },
  {
    n: "03",
    title: "Auto-DM + capture email",
    body: "Your link lands in their DMs in seconds — and the email goes straight to your list. Hands-off, every time.",
    chip: "DM sent + email saved",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From comment to DM in{" "}
              <span className="serif-italic text-gradient">three steps</span>.
            </>
          }
          subtitle="No flows to map, no Zapier spaghetti. Set it up in under two minutes and let it run while you sleep."
        />

        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          {/* connecting line */}
          <div className="pointer-events-none absolute left-0 right-0 top-[58px] hidden h-px bg-gradient-to-r from-transparent via-line to-transparent md:block" />

          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative h-full rounded-4xl border border-line bg-card p-7 ring-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold tracking-[0.1em] text-gradient">
                    {s.n}
                  </span>
                  <span className="rounded-full bg-paper px-3 py-1 text-[12.5px] font-medium text-ink">
                    {s.chip}
                  </span>
                </div>
                <h3 className="mt-6 text-[21px] font-semibold tracking-tight text-ink">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
                  {s.body}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
