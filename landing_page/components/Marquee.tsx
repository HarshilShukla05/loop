"use client";

const ITEMS = [
  "Indie hackers",
  "Course creators",
  "Reel-first brands",
  "Newsletter writers",
  "Coaches",
  "Digital product sellers",
  "Podcasters",
  "Meme pages",
  "Solopreneurs",
];

export default function Marquee() {
  return (
    <section className="relative border-y border-line bg-white/50 py-8">
      <p className="mb-6 text-center text-[12.5px] font-medium uppercase tracking-[0.18em] text-muted">
        Built for people who&apos;d rather create than babysit a CRM
      </p>
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10">
          {[...ITEMS, ...ITEMS].map((item, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-[18px] font-medium tracking-tight text-ink/70"
            >
              {item}
              <span className="ml-10 text-gradient">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
