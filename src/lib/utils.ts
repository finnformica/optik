import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const channels = {
  syncSessionProgress: (accountKey: number | string) =>
    `sync-sessions:${accountKey}:progress`,
};

export const endpoints = {
  user: "/api/user",
  data: "/api/data",
  accounts: "/api/accounts",
  transactions: "/api/transactions",
  auth: { schwab: { callback: "/api/schwab/auth/callback" } },
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
