import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const endpoints = {
  user: "/api/user",
  accounts: "/api/accounts",
  transactions: "/api/transactions",
  schwab: { data: "/api/schwab/data", callback: "/api/schwab/auth/callback" },
  stripe: { webhook: "/api/stripe/webhook", checkout: "/api/stripe/checkout" },
};

export const paths = {
  root: "/",
  home: "/home",
  help: "/help",
  error: "/error",
  pricing: "/pricing",
  analysis: "/analysis",
  positions: "/positions",
  dashboard: "/dashboard",
  transactions: "/transactions",
  auth: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    signOut: "/sign-out",
  },
  settings: {
    connections: "/settings/connections",
    general: "/settings/general",
    security: "/settings/security",
  },
};
