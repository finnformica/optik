import { endpoints } from "@/lib/utils";
import useSWR from "swr";
import { fetcher, postFetcher } from "./fetchers";

interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  broker?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function buildTransactionUrl(filters: TransactionFilters = {}) {
  const url = new URL(endpoints.transactions, window.location.origin);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value.toString());
    }
  });

  return url.toString();
}

export function useTransactions(filters: TransactionFilters = {}) {
  const url = buildTransactionUrl(filters);

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher
  );

  return {
    transactions: data?.transactions || [],
    pagination: data?.pagination || null,
    filters: data?.filters || null,
    error,
    isLoading,
    mutate,
  };
}

export async function syncTransactions() {
  const URL = endpoints.data.sync;
  return postFetcher(URL);
}

export async function importCsvTransactions(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(endpoints.data.import, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Import failed");
  }

  return response.json();
}
