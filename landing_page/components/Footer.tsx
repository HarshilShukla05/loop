import Logo from "@/components/ui/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: ["How it works", "Features", "vs ManyChat", "Pricing"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Refund policy", "Status"],
  },
];

export default function Footer() {
  return (
    <footer className="relative px-4 pb-10 pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 border-t border-line pt-12 md:grid-cols-[1.4fr,1fr,1fr,1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14.5px] leading-relaxed text-muted">
              Turn Instagram comments into DMs, followers and emails — flat
              ₹200/month, no viral penalty.
            </p>
            <p className="mt-5 text-[13px] text-muted">
              Get that reach. ✦
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-[14.5px] text-muted transition-colors hover:text-ink"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 text-[13px] text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} loop. Made for creators, in India.</p>
          <p>
            Not affiliated with Instagram or Meta. Built on the official
            Messaging API.
          </p>
        </div>
      </div>
    </footer>
  );
}
