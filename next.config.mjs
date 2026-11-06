// Everything the site loads comes from its own origin. Scripts and styles
// still need 'unsafe-inline': Next 14 inlines its bootstrap and the intro
// script in app/layout.tsx, and framer-motion writes inline styles. The
// Vercel analytics scripts load from /_vercel on production and from
// va.vercel-scripts.com in development. Dev also needs eval and a websocket
// for fast refresh, so the policy is only sent from production builds.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://va.vercel-scripts.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const security = [
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: security },
      // Film frames are requested with ?v=<filmVersion> (lib/film.ts), which
      // changes with every render, so they can be cached for a year. Without
      // this Vercel serves public files with max-age=0 and a returning reader
      // revalidates all ~1,400 frames.
      {
        source: "/film/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
