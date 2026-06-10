"use client";

import { motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const FEATURES = [
  {
    icon: "∞",
    title: "Unlimited comments & DMs",
    body: "Go viral on Tuesday, go viral again on Friday. loop never throttles you, never charges per message — and every DM lands in seconds, while interest is hot.",
    span: "md:col-span-2",
  },
  {
    icon: "🔒",
    title: "Follow-gating",
    body: "Only send to people who follow you — turn comments into followers, then customers.",
    span: "",
  },
  {
    icon: "✉️",
    title: "Email capture",
    body: "Every DM can collect an email and pipe it to your list. Own your audience off-platform.",
    span: "",
  },
  {
    icon: "🎯",
    title: "Posts + Reels + Stories",
    body: "Trigger on any surface. One keyword can power a whole campaign across your content.",
    span: "",
  },
  {
    icon: "🇮🇳",
    title: "Priced for creators",
    body: "Flat ₹200/month. UPI & cards. Built for India first, loved everywhere.",
    span: "",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative bg-white/40 px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="left"
          eyebrow="Features"
          title={
            <>
              Everything you need to{" "}
              <span className="serif-italic text-gradient">
                convert the scroll
              </span>
              .
            </>
          }
        />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08} className={f.span}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group relative h-full overflow-hidden rounded-4xl border border-line bg-paper p-7"
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-ig opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20" />
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white text-[20px]">
                  {f.icon}
                </span>
                <h3 className="mt-5 text-[19px] font-semibold tracking-tight text-ink">
                  {f.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  {f.body}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
