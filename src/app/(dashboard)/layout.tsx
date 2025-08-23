import Sidebar from "@/components/layout/sidebar";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-h-screen bg-[#111827]">
      <Sidebar />
      <div className="flex-1 overflow-auto ml-16">{children}</div>
    </div>
  );
}
