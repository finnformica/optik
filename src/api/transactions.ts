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
