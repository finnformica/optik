import { DimUser } from "@/lib/db/schema";
import { UserRole } from "@/types/user";
import { endpoints } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "./fetchers";

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<DimUser>(
    endpoints.user.base,
    fetcher
  );

  return { user: data, error, isLoading, mutate };
}

export function useUserRole() {
  const { data, error, isLoading, mutate } = useSWR<UserRole>(
    endpoints.user.role,
    fetcher
  );

  return { role: data, error, isLoading, mutate };
}

export function useUserSubscription() {
  const { data, error, isLoading, mutate } = useSWR<{
    hasActiveSubscription: boolean;
    subscriptionStatus: string | null;
    planName: string | null;
    currentPeriodEnd: Date | null;
  }>(endpoints.user.subscription, fetcher);

  return { subscription: data, error, isLoading, mutate };
}
