"use client";

import { Button } from "@/components/ui/button";
import {
  Activity,
  Link as LinkIcon,
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
    <div className="min-h-full flex flex-col lg:flex-row">
      {/* Floating Sidebar Container */}
      <nav className="lg:h-auto overflow-y-auto pr-6 min-w-60">
        <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700/50 pb-4">
          Settings
        </h2>
        <div className="flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-x-visible">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant="ghost"
                className={`w-full justify-start transition-colors duration-200 ${
                  pathname === item.href
                    ? "bg-blue-600/20 text-blue-300"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                } rounded-lg`}
              >
                <item.icon className="h-4 w-4 md:mr-3 flex-shrink-0" />
                <span className="font-medium hidden md:block">
                  {item.label}
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content with better spacing */}
      <main className="flex-1 lg:pr-6 lg:pb-6 overflow-y-auto">
        <div className="pt-6 lg:p-0">{children}</div>
      </main>
    </div>
  );
}
