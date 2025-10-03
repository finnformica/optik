"use client";

import { Button } from "@/components/ui/button";
import { paths } from "@/lib/utils";
import { CreditCard, Link as LinkIcon, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: paths.settings.general, icon: Settings, label: "General" },
    { href: paths.settings.connections, icon: LinkIcon, label: "Connections" },
    {
      href: paths.settings.subscription,
      icon: CreditCard,
      label: "Subscription",
    },
    { href: paths.settings.security, icon: Shield, label: "Security" },
  ];

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Floating Sidebar Container */}
      <nav className="min-w-60 overflow-y-auto pr-6 lg:h-auto">
        <h2 className="mb-4 border-b border-gray-700/50 pb-4 text-xl font-semibold text-white">
          Settings
        </h2>
        <div className="flex gap-0.5 overflow-x-auto lg:flex-col lg:overflow-x-visible">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant="ghost"
                className={`w-full justify-start transition-colors duration-200 ${
                  pathname === item.href
                    ? "bg-blue-600/20 text-blue-300"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                } rounded-lg`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0 md:mr-3" />
                <span className="hidden font-medium md:block">
                  {item.label}
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content with better spacing */}
      <main className="flex-1 overflow-y-auto lg:pr-6 lg:pb-6">
        <div className="pt-6 lg:p-0">{children}</div>
      </main>
    </div>
  );
}
