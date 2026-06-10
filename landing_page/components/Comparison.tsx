"use client";

import { motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const ROWS = [
  {
    label: "Pricing model",
    loop: "Flat ₹200/mo ($2.50)",
    them: "$15+/mo, climbs with contacts",
  },
  {
    label: "Contacts / subscribers",
    loop: "Unlimited",
    them: "Capped — pay more past each tier",
  },
  { label: "Comments captured", loop: "Unlimited", them: "Tier-limited" },
  { label: "DMs sent", loop: "Unlimited", them: "Tier-limited" },
  {
    label: "Going viral",
    loop: "Costs you ₹0 extra",
    them: "Bumps you to a pricier tier",
  },
  { label: "Follow-gating", loop: true, them: "On higher plans" },
  { label: "Email capture", loop: true, them: "Add-ons / higher plans" },
  { label: "Setup time", loop: "Under 2 minutes", them: "Flow builder learning curve" },
  { label: "Made for", loop: "Creators in India + global", them: "Enterprise-leaning" },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/12 text-[13px] text-emerald-600">
        ✓
      </span>
    );
  return <span>{value}</span>;
}

export default function Comparison() {
  return (
    <section id="compare" className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="loop vs ManyChat"
          title={
            <>
              Stop being{" "}
              <span className="serif-italic text-gradient">penalized</span> for
              going viral.
            </>
          }
          subtitle="Contact-based pricing punishes the exact thing you’re working for — reach. loop charges one flat price, forever."
        />

        <Reveal className="mt-14">
          <div className="overflow-hidden rounded-4xl border border-line bg-card ring-soft">
            {/* header */}
            <div className="grid grid-cols-[1.3fr,1fr,1fr] items-stretch">
              <div className="px-5 py-5 sm:px-7" />
              <div className="relative bg-gradient-ig px-4 py-5 text-center sm:px-6">
                <span className="text-[17px] font-semibold tracking-tight text-white">
                  loop
                </span>
                <span className="mt-0.5 block text-[12px] text-white/80">
                  Get that reach
                </span>
              </div>
              <div className="px-4 py-5 text-center sm:px-6">
                <span className="text-[17px] font-semibold tracking-tight text-ink/70">
                  ManyChat
                </span>
                <span className="mt-0.5 block text-[12px] text-muted">
                  Tiered by contacts
                </span>
              </div>
            </div>

            {ROWS.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className={`grid grid-cols-[1.3fr,1fr,1fr] items-center border-t border-line text-[14px] ${
                  i % 2 ? "bg-paper/40" : ""
                }`}
              >
                <div className="px-5 py-4 font-medium text-ink sm:px-7">
                  {row.label}
                </div>
                <div className="bg-paper/60 px-4 py-4 text-center font-medium text-ink sm:px-6">
                  <Cell value={row.loop} />
                </div>
                <div className="px-4 py-4 text-center text-muted sm:px-6">
                  <Cell value={row.them} />
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-5 text-center text-[13px] text-muted">
            Comparison reflects publicly listed contact-based tiers. loop stays
            flat no matter how big you get.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
