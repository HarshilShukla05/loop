# loop — landing page

> Turn Instagram comments into DMs. **Get that reach.**

Aesthetic-first, high-converting landing page for **loop**, the flat-priced
(₹200/month) ManyChat alternative for creators.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** (light editorial design system)
- **Framer Motion** (scroll reveals, magnetic buttons, looping chat demo)
- Fonts: Inter + Instrument Serif (via `next/font`)

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm run start   # production
```

## Deploy

Push to GitHub and import into **Vercel** — zero config.

## Sections

`Nav · Hero (live comment→DM demo) · Marquee · How it works · Features · vs ManyChat · Pricing · FAQ · Final CTA · Footer`

## Wiring up payments

The pricing + CTA buttons (`components/Pricing.tsx`, `components/ui/MagneticButton.tsx`)
currently point to `#`. Hook them to your gateway when ready:

- **India / ₹** → Razorpay Checkout or a Payment Link
- **Global / $** → Stripe Checkout

Replace the `href="#"` on the primary CTAs with your checkout URL (or wire an
`onClick` to open the gateway modal).

## Design tokens

Defined in `tailwind.config.ts` + `app/globals.css`:

- **paper** `#FBFAF7` · **ink** `#0A0A0A` · **muted** `#6B6B6B` · **line** `#ECEAE4`
- One accent: the Instagram gradient (`.text-gradient` / `.bg-gradient-ig`), used sparingly.
