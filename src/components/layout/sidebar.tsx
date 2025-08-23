"use client";

import {
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="w-16 bg-[#0a101e] text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-4 border-b border-gray-800 flex justify-center">
        <h1 className="text-xl font-bold">OT</h1>
      </div>
      <nav className="flex-1 pt-4">
        <Link
          href="/dashboard"
          className={`flex items-center justify-center p-4 my-1 mx-2 rounded-lg ${
            pathname === "/dashboard"
              ? "bg-blue-900/50 text-blue-400"
              : "hover:bg-gray-800"
          }`}
          title="Dashboard"
        >
          <LayoutDashboard className="h-5 w-5" />
        </Link>
        <Link
          href="/positions"
          className={`flex items-center justify-center p-4 my-1 mx-2 rounded-lg ${
            pathname === "/positions"
              ? "bg-blue-900/50 text-blue-400"
              : "hover:bg-gray-800"
          }`}
          title="Positions"
        >
          <TrendingUp className="h-5 w-5" />
        </Link>
        <Link
          href="/analysis"
          className={`flex items-center justify-center p-4 my-1 mx-2 rounded-lg ${
            pathname === "/analysis"
              ? "bg-blue-900/50 text-blue-400"
              : "hover:bg-gray-800"
          }`}
          title="Analysis"
        >
          <BarChart3 className="h-5 w-5" />
        </Link>
      </nav>
      <div className="mt-auto pb-4">
        <Link
          href="/settings"
          className={`flex items-center justify-center p-4 my-1 mx-2 rounded-lg ${
            pathname === "/settings"
              ? "bg-blue-900/50 text-blue-400"
              : "hover:bg-gray-800"
          }`}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <button
          className="flex items-center justify-center p-4 my-1 mx-2 rounded-lg hover:bg-gray-800"
          title="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          className="flex items-center justify-center p-4 my-1 mx-2 rounded-lg hover:bg-gray-800"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
