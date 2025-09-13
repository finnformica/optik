import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const endpoints = {
  accounts: "/api/accounts",
  transactions: "/api/transactions",
  schwab: { data: "/api/schwab/data" },
};

export const paths = {
  root: "/",
  home: "/home",
  help: "/help",
  settings: "/settings",
  analysis: "/analysis",
  positions: "/positions",
  dashboard: "/dashboard",
  transactions: "/transactions",
  auth: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    signOut: "/sign-out",
  },
};