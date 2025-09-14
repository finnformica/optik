import type { Metadata } from "next";
import { SWRConfig } from "swr";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Options Trading Dashboard",
  description:
    "Professional options trading dashboard with portfolio analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
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
