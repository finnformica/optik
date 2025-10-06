"use client";

import { LayoutDashboard, LogOut, Settings, Table2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { paths } from "@/lib/utils";

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

const menuItems: MenuItem[] = [
  { href: paths.dashboard, icon: LayoutDashboard, title: "Dashboard" },
  { href: paths.transactions, icon: Table2, title: "Transactions" },
  { href: paths.settings.general, icon: Settings, title: "Settings" },
  { href: paths.auth.signOut, icon: LogOut, title: "Sign Out" },
];

const BottomNavigation = () => {
  const pathname = usePathname();

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = pathname.includes(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex flex-1 flex-col items-center justify-center py-1.5 transition-colors ${
          isActive ? "text-blue-400" : "text-gray-400 hover:text-white"
        }`}
      >
        <Icon className="h-4 w-4" />
        <span className="mt-0.5 text-[10px]">{item.title}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="flex h-12 rounded-full bg-[#0a101e]/90 backdrop-blur-md border border-gray-800/50 shadow-lg">
        {menuItems.map(renderMenuItem)}
      </div>
    </nav>
  );
};

export default BottomNavigation;