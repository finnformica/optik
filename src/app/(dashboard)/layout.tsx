import Sidebar from "@/components/layout/sidebar";
import { AccountProvider } from "@/lib/providers/account-provider";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountProvider>
      <Sidebar />
      <div className="h-screen w-screen py-2 pr-2">
        <main className="h-full overflow-y-scroll ml-64 p-6 rounded-lg bg-[#111827]">
          {children}
        </main>
      </div>
    </AccountProvider>
  );
}
