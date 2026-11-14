import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/Nav";
import IntroCurtain from "@/components/IntroCurtain";
import MotionProvider from "@/components/MotionProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Self-hosted (latin subset) rather than next/font/google: the Google loader
// hashes its class names from the CSS Google serves at build time, and on
// Vercel the server and client compiles once got different CSS, so the HTML
// named font classes the stylesheet never defined and every page fell back to
// the browser's serif. Local files hash the same in both compiles.
const sans = localFont({
  src: "./fonts/SchibstedGrotesk-Latin.woff2",
  weight: "400 900",
  display: "swap",
  variable: "--font-sans",
});

const mono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular-Latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-Medium-Latin.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scatolin.com"),
  title: "Matheus Ferracciú Scatolin | AI Engineer and Researcher",
  description:
    "AI Engineer at Valor Capital Group and Computer Engineering student at Unicamp, ranked 1st of 102. Agentic AI, knowledge graphs, Graph-RAG and LLM system architecture.",
  keywords: [
    "Matheus Scatolin",
    "AI Engineer",
    "AI Researcher",
    "Unicamp",
    "Knowledge Graphs",
    "Graph-RAG",
    "Agentic AI",
    "LLM",
    "Machine Learning",
  ],
  alternates: {
    types: {
      "text/markdown": "/llms.txt",
    },
  },
  openGraph: {
    title: "Matheus Ferracciú Scatolin | AI Engineer and Researcher",
    description: "Agentic AI, knowledge graphs and LLM systems, from paper to production.",
    url: "https://scatolin.com",
    siteName: "Matheus F. Scatolin",
    locale: "en_US",
    type: "website",
  },
};

// Runs before first paint: the intro curtain plays only on the homepage, so
// deep links (case pages, or a section like /#work) skip it, as do repeat
// visits in the same session and reduced-motion users, so it never flashes.
// On a first visit, mark the intro done once the hero choreography has
// finished, so a client-side return to the homepage does not wait on the
// curtain again. On iOS it also feeds the scroll offset to the intro floor
// (see globals.css) until then.
const introScript = `try{var d=document.documentElement;if(location.pathname!=='/'||location.hash||sessionStorage.getItem('ms-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.intro='done'}else{sessionStorage.setItem('ms-intro','1');var f=function(){d.style.setProperty('--intro-scroll',scrollY+'px')};if(CSS.supports('-webkit-touch-callout','none'))addEventListener('scroll',f,{passive:true});setTimeout(function(){d.dataset.intro='done';removeEventListener('scroll',f)},3400)}}catch(e){document.documentElement.dataset.intro='done'}`;

// Without JS, framer-motion never runs, so scroll reveals would stay at their
// server-rendered start state (hidden) and the pinned Graph of Work would
// never advance. Force the reveals visible and show the static graph.
const noscriptStyle = `<style>[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}[data-graph=pinned]{display:none!important}[data-graph=static]{display:block!important}</style>`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <noscript dangerouslySetInnerHTML={{ __html: noscriptStyle }} />
      </head>
      <body className="font-sans">
        <IntroCurtain />
        <MotionProvider>
          <Nav />
          {children}
        </MotionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
