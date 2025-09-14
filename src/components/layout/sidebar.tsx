"use client";

import {
  CircleIcon,
  LayoutDashboard,
  LogOut,
  Settings,
  Table2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { paths } from "@/lib/utils";

import { AccountMenu } from "./account-menu";

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  bottom?: boolean;
}

const menuItems: MenuItem[] = [
  { href: paths.dashboard, icon: LayoutDashboard, title: "Dashboard" },
  { href: paths.transactions, icon: Table2, title: "Transactions" },
  // { href: paths.positions, icon: Receipt, title: "Positions" },
  // { href: paths.analysis, icon: BarChart3, title: "Analysis" },
  {
    href: paths.settings.general,
    icon: Settings,
    title: "Settings",
    bottom: true,
  },
  // { href: paths.help, icon: HelpCircle, title: "Help", bottom: true },
  { href: paths.auth.signOut, icon: LogOut, title: "Sign Out", bottom: true },
];

const Sidebar = () => {
  const pathname = usePathname();

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = pathname.includes(item.href);

    return (
      <Tooltip key={item.href}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={`flex items-center justify-center p-4 mb-2 mx-2 rounded-lg transition-colors ${
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
    <div className="w-18 bg-[#0a101e] text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="m-2 mb-2 rounded-lg p-4 flex justify-center bg-[#111827]">
        <CircleIcon className="text-blue-400" />
      </div>
      <nav className="flex-1">{topMenuItems.map(renderMenuItem)}</nav>
      <div className="mt-auto pb-4">
        <AccountMenu />
        {bottomMenuItems.map(renderMenuItem)}
      </div>
    </div>
  );
};

export default Sidebar;
