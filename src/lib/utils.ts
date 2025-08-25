import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const endpoints = {
  transactions: "/api/transactions",
  positions: "/api/positions",
  schwab: {
    data: "/api/schwab/data"
  },
};

export const paths = {
  transactions: "/transactions",
  positions: "/positions",
  dashboard: "/dashboard",
  analysis: "/analysis",
  settings: "/settings",
  logout: "/logout",
  help: "/help",
};