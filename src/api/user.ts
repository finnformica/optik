import { DimUser } from "@/lib/db/schema";
import { endpoints } from "@/lib/utils";
import { UserSubscription, AccountLimitCheck } from "@/types/user";
import useSWR from "swr";
import { fetcher } from "./fetchers";

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<DimUser>(
    endpoints.user.base,
    fetcher,
  );

  return { user: data, error, isLoading, mutate };
}

export function useUserSubscription() {
  const { data, error, isLoading, mutate } = useSWR<UserSubscription>(
    endpoints.user.subscription,
    fetcher,
  );

  return { subscription: data, error, isLoading, mutate };
}

export function useAccountLimitCheck() {
  const { data, error, isLoading, mutate } = useSWR<AccountLimitCheck>(
    endpoints.user.accountLimitCheck,
    fetcher,
  );

  return {
    limitCheck: data,
    error,
    isLoading,
    mutate
  };
}

export function useAccountKey() {
  const { data, error, isLoading, mutate } = useSWR<{ accountKey: number | null }>(
    endpoints.user.accountKey,
    fetcher,
  );

  return {
    accountKey: data?.accountKey || null,
    error,
    isLoading,
    refresh: mutate,
  };
}
