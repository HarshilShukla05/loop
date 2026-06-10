import Reveal from "@/components/ui/Reveal";
import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  align?: "center" | "left";
};

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: Props) {
  const isCenter = align === "center";
  return (
    <Reveal
      className={`flex flex-col ${
        isCenter ? "items-center text-center" : "items-start text-left"
      }`}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1 text-[12.5px] font-medium uppercase tracking-[0.14em] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-gradient-ig" />
        {eyebrow}
      </span>
      <h2
        className={`mt-5 max-w-2xl text-[clamp(2rem,4.2vw,3.1rem)] font-semibold leading-[1.02] tracking-tightest text-ink ${
          isCenter ? "" : "max-w-3xl"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 max-w-xl text-[16.5px] leading-relaxed text-muted ${
            isCenter ? "" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
