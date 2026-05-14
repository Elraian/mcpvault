import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: "mcp-vault — Local credential vault for Claude and other AI agents",
  description:
    "Store many accounts per service (Supabase, GitHub, Vercel, Stripe) in an AES-256-GCM encrypted vault. Let Claude pick the right one on the fly — no restart, no token-swapping by hand.",
  metadataBase: new URL("https://mcp-vault.local"),
  openGraph: {
    title: "mcp-vault — Local credential vault for AI agents",
    description:
      "One encrypted vault. Many accounts per service. Claude picks the right one from natural language.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}
    >
      <body className="bg-bg text-fg font-sans antialiased grain">
        {children}
      </body>
    </html>
  );
}
