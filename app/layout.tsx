import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ScrollProgress from "@/components/ScrollProgress";
import Navbar from "@/components/Navbar";
import CustomCursor from "@/components/CustomCursor";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Matheus Ferracciú Scatolin | AI Researcher & Engineer",
  description:
    "Portfolio of a Computer Engineer specializing in AI, Quantitative Finance, and Cybersecurity. 1st/102 at UNICAMP.",
  keywords: [
    "AI Researcher",
    "Computer Engineer",
    "UNICAMP",
    "Machine Learning",
    "Cybersecurity",
    "Matheus Scatolin",
    "Quantitative Finance",
    "Graph-RAG",
    "Deep Learning",
  ],
  openGraph: {
    title: "Matheus Ferracciú Scatolin | AI Researcher",
    description: "Building autonomous systems and quantitative models.",
    url: "https://matheus-scatolin.vercel.app",
    siteName: "Matheus F. Scatolin Portfolio",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className={inter.className}>
        <CustomCursor />
        <ScrollProgress />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
