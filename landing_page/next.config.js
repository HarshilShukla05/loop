/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export: `next build` emits a fully static site to out/ — no server
  // runtime needed, which is what Cloudflare Pages serves directly.
  output: "export",
  images: { unoptimized: true },
  basePath: process.env.NEXT_BASE_PATH || "",
};

module.exports = nextConfig;
