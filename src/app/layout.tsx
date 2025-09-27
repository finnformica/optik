import type { Metadata } from "next";
import { SWRConfig } from "swr";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Optik Trading",
  description:
    "Professional options trading dashboard with portfolio analysis.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "android-chrome", url: "/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "android-chrome", url: "/android-chrome-512x512.png", sizes: "512x512" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="a2a51957-134b-4531-9ed1-605eefc80392" />
      </head>
      <body className="min-h-screen bg-background">
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            keepPreviousData: true,
          }}
        >
          {children}
        </SWRConfig>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
