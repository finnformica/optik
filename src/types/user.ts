export type UserRole = "basic" | "pro" | "admin";

export type UserSubscription = {
  role: UserRole;
  hasActiveSubscription: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};
