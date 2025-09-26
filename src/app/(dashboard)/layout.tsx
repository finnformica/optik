import Sidebar from "@/components/layout/sidebar";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Just ensure user is authenticated - components will handle their own account key needs
  await getAuthenticatedUser();

  return (
    <>
      <Sidebar />
      <div className="h-screen w-screen py-2 pr-2">
        <main className="ml-18 h-full overflow-x-clip overflow-y-scroll rounded-lg bg-[#111827] p-6">
          {children}
        </main>
      </div>
    </>
  );
}
