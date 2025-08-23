import type { Metadata } from "next";
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
    <html lang="en" className="bg-[#111827]">
      <body className="min-h-screen bg-[#111827] text-white">{children}</body>
    </html>
  );
}
