import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, Caveat, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { SITE } from "@/lib/config";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});
const caveat = Caveat({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--font-script" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · BLOK Capital`,
    template: "%s · BLOK Capital Docs",
  },
  description: SITE.tagline,
  openGraph: { title: SITE.name, description: SITE.tagline, type: "website", siteName: SITE.name },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F0",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${caveat.variable} ${jetbrains.variable} bg-paper text-ink`}
    >
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
