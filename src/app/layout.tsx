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
      {
        rel: "android-chrome",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
      },
      {
        rel: "android-chrome",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
      },
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
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="a2a51957-134b-4531-9ed1-605eefc80392"
        />
      </head>
      <body className="bg-background min-h-screen">
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            keepPreviousData: true,
          }}
        >
          {children}
        </SWRConfig>
        <Toaster richColors position="bottom-right" />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `window.$sleek=[];window.SLEEK_PRODUCT_ID=432217002;(function(){d=document;s=d.createElement("script");s.src="https://client.sleekplan.com/sdk/e.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`
          }}
        />
      </body>
    </html>
  );
}
