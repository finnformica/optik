import Sidebar from "@/components/layout/sidebar";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="h-screen w-screen py-2 pr-2">
        <main className="h-full overflow-y-scroll ml-16 p-6 rounded-lg bg-[#111827]">
          {children}
        </main>
      </div>
    </>
  );
}
