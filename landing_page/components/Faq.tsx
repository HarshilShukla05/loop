"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const QA = [
  {
    q: "Is this safe for my Instagram account?",
    a: "Yes. loop works within Instagram’s official Messaging API for professional and creator accounts — the same foundation tools like ManyChat use. No password sharing, no sketchy automation.",
  },
  {
    q: "Do I need to know how to code or build flows?",
    a: "Not at all. Connect your account, pick a post, type your keyword and the message to send. That’s the whole setup — usually under two minutes.",
  },
  {
    q: "What actually happens when I go viral?",
    a: "Nothing changes on your bill. Whether 50 people or 50,000 people comment your keyword, you pay the same flat ₹200/month. That’s the entire point of loop.",
  },
  {
    q: "Can I really capture emails through a DM?",
    a: "Yes. loop can ask for an email as part of the DM flow and save it straight to your list, so you build an audience you actually own — not one you rent from the algorithm.",
  },
  {
    q: "How do I pay — does it work in India and globally?",
    a: "Pricing is ₹200/month (about $2.50). We support UPI and cards for India and global payment methods for everyone else. Billed monthly, cancel anytime.",
  },
  {
    q: "Is there a free trial or refund?",
    a: "We’ll offer a no-risk trial window at launch so you can run a real campaign before paying. If loop isn’t for you, cancel in one click — no contracts.",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[16.5px] font-medium tracking-tight text-ink">
          {q}
        </span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-transform duration-300 ${
            open ? "rotate-45 bg-gradient-ig text-white" : "bg-card"
          }`}
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-5 text-[15px] leading-relaxed text-muted">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  return (
    <section id="faq" className="relative px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              The{" "}
              <span className="serif-italic text-gradient">honest</span>{" "}
              answers.
            </>
          }
        />
        <Reveal className="mt-12">
          <div>
            {QA.map((item) => (
              <Item key={item.q} {...item} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
