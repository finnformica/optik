import { DimAccount } from "@/lib/db/schema";

export type UserRole = "basic" | "pro" | "admin";

export type UserSubscription = {
  role: UserRole;
  hasActiveSubscription: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type AccountLimitCheck = {
  userRole: UserRole;
  accountCount: number;
  accountLimit: number;
  hasExceededLimit: boolean;
  needsAccountSelection: boolean;
  accounts: DimAccount[];
};
