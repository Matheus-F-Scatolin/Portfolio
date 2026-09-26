import type { Metadata } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import IntroCurtain from "@/components/IntroCurtain";
import MotionProvider from "@/components/MotionProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://matheus-scatolin.vercel.app"),
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
    url: "https://matheus-scatolin.vercel.app",
    siteName: "Matheus F. Scatolin",
    locale: "en_US",
    type: "website",
  },
};

// Runs before first paint: the intro curtain plays only on the homepage, so
// deep links (case pages) skip it, as do repeat visits in the same session
// and reduced-motion users, so it never flashes. On a first visit, mark the
// intro done once the hero choreography has finished, so a client-side
// return to the homepage does not wait on the curtain again.
const introScript = `try{var d=document.documentElement;if(location.pathname!=='/'||sessionStorage.getItem('ms-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.intro='done'}else{sessionStorage.setItem('ms-intro','1');setTimeout(function(){d.dataset.intro='done'},3400)}}catch(e){document.documentElement.dataset.intro='done'}`;

// Without JS, framer-motion never runs, so scroll reveals would stay at their
// server-rendered start state (hidden). Force them visible.
const noscriptStyle = `<style>[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}</style>`;

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
