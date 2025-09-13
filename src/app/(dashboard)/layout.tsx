import Sidebar from "@/components/layout/sidebar";
import { SessionProvider } from "@/components/providers/session-provider";
import { getSession } from "@/lib/auth/session";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <SessionProvider session={session}>
      <Sidebar />
      <div className="h-screen w-screen py-2 pr-2">
        <main className="h-full overflow-y-scroll ml-18 p-6 rounded-lg bg-[#111827]">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
