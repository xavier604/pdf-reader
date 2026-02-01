import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
};

const APP_TITLE = "PDF Reader";
const APP_DESCRIPTION =
  "Privacy-first PDF reader that runs entirely in your browser. No uploads, no backend — view, annotate, and store PDFs client-side with IndexedDB. Self-hostable with Docker.";

export const metadata: Metadata = {
  metadataBase: new URL("https://pdf-reader-gamma.vercel.app"),
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_TITLE,
  },
  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    type: "website",
    locale: "en_US",
    url: "https://pdf-reader-gamma.vercel.app",
    images: [
      {
        url: "/og-image.png",
        alt: "PDF Reader — privacy-first client-side PDF viewer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
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
