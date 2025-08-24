"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  bottom?: boolean;
}

const menuItems: MenuItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, title: "Dashboard" },
  { href: "/positions", icon: TrendingUp, title: "Positions" },
  { href: "/transactions", icon: Receipt, title: "Transactions" },
  { href: "/analysis", icon: BarChart3, title: "Analysis" },
  { href: "/settings", icon: Settings, title: "Settings", bottom: true },
  { href: "/help", icon: HelpCircle, title: "Help", bottom: true },
  { href: "/logout", icon: LogOut, title: "Logout", bottom: true },
];

const Sidebar = () => {
  const pathname = usePathname();

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <Tooltip key={item.href}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={`flex items-center justify-center p-4 my-1 mx-2 rounded-lg transition-colors ${
              isActive ? "bg-blue-900/50 text-blue-400" : "hover:bg-gray-800"
            }`}
          >
            <Icon className="h-5 w-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" showArrow={false} sideOffset={10}>
          <p>{item.title}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const topMenuItems = menuItems.filter((item) => !item.bottom);
  const bottomMenuItems = menuItems.filter((item) => item.bottom);

  return (
    <div className="w-16 bg-[#0a101e] text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-4 border-b border-gray-800 flex justify-center">
        <h1 className="text-xl font-bold">XYZ</h1>
      </div>
      <nav className="flex-1 pt-4">{topMenuItems.map(renderMenuItem)}</nav>
      <div className="mt-auto pb-4">{bottomMenuItems.map(renderMenuItem)}</div>
    </div>
  );
};

export default Sidebar;
