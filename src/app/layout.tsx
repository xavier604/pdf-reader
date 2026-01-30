import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
};

export const metadata: Metadata = {
  title: "PDF Reader",
  description: "A client-side PDF reader built with Next.js and EmbedPDF. No backend required.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PDF Reader",
  },
  openGraph: {
    title: "PDF Reader",
    description: "A client-side PDF reader built with Next.js and EmbedPDF. No backend required.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "PDF Reader",
    description: "A client-side PDF reader built with Next.js and EmbedPDF. No backend required.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
