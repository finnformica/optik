import { endpoints } from "@/lib/utils";
import useSWR from "swr";
import { fetcher, postFetcher } from "./fetchers";

export function useTransactions() {
  const { data, error, isLoading, mutate } = useSWR(
    endpoints.transactions,
    fetcher
  );

  return {
    transactions: data?.transactions || [],
    error,
    isLoading,
    mutate,
  };
}

export async function syncTransactions(sessionId?: string) {
  const URL = sessionId
    ? `${endpoints.schwab.data}?sessionId=${sessionId}`
    : endpoints.schwab.data;

  return postFetcher(URL);
}
