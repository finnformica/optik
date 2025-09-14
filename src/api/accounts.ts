import { endpoints } from "@/lib/utils";
import useSWR from "swr";

import { DimAccount } from "@/lib/db/schema";
import { fetcher } from "./fetchers";

export function useGetUserAccounts() {
  const URL = endpoints.accounts;
  const { data, error, isLoading, mutate } = useSWR(URL, fetcher);

  return {
    accounts: data as DimAccount[] | undefined,
    error,
    isLoading,
    mutate,
  };
}
