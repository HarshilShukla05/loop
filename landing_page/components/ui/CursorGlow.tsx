"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const INTERACTIVE =
  "a, button, [role='button'], input, textarea, select, label, summary";

/**
 * Site-wide cursor companion: a soft coral light that drifts after the
 * pointer, and a quiet ring that only wakes up over interactive elements.
 * Never replaces or hides the native cursor, never intercepts events.
 * Renders nothing on coarse pointers and for reduced-motion users.
 */
export default function CursorGlow() {
  const reducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [present, setPresent] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);

  // The glow is heavy light — it lags and settles. The ring is alert.
  const glowX = useSpring(mx, { stiffness: 80, damping: 22, mass: 0.9 });
  const glowY = useSpring(my, { stiffness: 80, damping: 22, mass: 0.9 });
  const ringX = useSpring(mx, { stiffness: 520, damping: 38, mass: 0.35 });
  const ringY = useSpring(my, { stiffness: 520, damping: 38, mass: 0.35 });

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(fine.matches);
    sync();
    fine.addEventListener("change", sync);
    return () => fine.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled || reducedMotion) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx.set(e.clientX);
      my.set(e.clientY);
      setPresent(true);
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      setHovering(Boolean(target?.closest(INTERACTIVE)));
    };
    const onLeave = () => setPresent(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, reducedMotion, mx, my]);

  if (!enabled || reducedMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      {/* ambient light that drifts after the cursor */}
      <motion.div
        className="absolute left-0 top-0 will-change-transform"
        style={{ x: glowX, y: glowY }}
        animate={{
          opacity: present ? 1 : 0,
          scale: pressed ? 0.9 : hovering ? 1.18 : 1,
        }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { type: "spring", stiffness: 240, damping: 20 },
        }}
      >
        <div className="h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--coral)/0.08),transparent_72%)] dark:bg-[radial-gradient(closest-side,rgb(var(--coral)/0.13),transparent_72%)]" />
      </motion.div>

      {/* ring that wakes up over links and buttons */}
      <motion.div
        className="absolute left-0 top-0 will-change-transform"
        style={{ x: ringX, y: ringY }}
        animate={{
          opacity: present && hovering ? 1 : 0,
          scale: hovering ? (pressed ? 0.72 : 1) : 0.4,
        }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      >
        <div className="h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-coral/50" />
      </motion.div>
    </div>
  );
}
