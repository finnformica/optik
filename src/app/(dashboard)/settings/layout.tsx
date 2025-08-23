"use client";

import { Button } from "@/components/ui/button";
import {
  Activity,
  Link as LinkIcon,
  Menu,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: "/settings", icon: Users, label: "Team" },
    { href: "/settings/general", icon: Settings, label: "General" },
    { href: "/settings/connections", icon: LinkIcon, label: "Connections" },
    { href: "/settings/activity", icon: Activity, label: "Activity" },
    { href: "/settings/security", icon: Shield, label: "Security" },
  ];

  return (
    <div className="flex min-h-screen bg-[#111827]">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-[#1f2937] border-b border-gray-700 p-4">
        <div className="flex items-center">
          <span className="font-medium text-white">Settings</span>
        </div>
        <Button
          className="-mr-3 text-white hover:bg-gray-700"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 pt-16 lg:pt-0">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-[#1f2937] border-r border-gray-700 lg:block ${
            isSidebarOpen ? "block" : "hidden"
          } lg:relative fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="h-full overflow-y-auto p-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Settings
              </h2>
            </div>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant="ghost"
                  className={`shadow-none my-1 w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700 ${
                    pathname === item.href ? "bg-gray-700 text-white" : ""
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
