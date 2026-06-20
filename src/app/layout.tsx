import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "LLM Semantic Router - Parameter & Cost Optimization Dashboard",
  description: "Interactive dashboard demonstrating how semantic routing saves costs and reduces latency by directing queries to appropriate LLM sizes (Gemini Nano, Flash, Pro, Ultra).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
