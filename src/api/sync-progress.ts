import { endpoints } from "@/lib/utils";
import { SyncProgressData } from "@/types/sync-progress";
import useSWR from "swr";
import { fetcher } from "./fetchers";

export function useSyncProgress() {
  const { data, error, isLoading, mutate } = useSWR<SyncProgressData>(
    endpoints.sync.progress,
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
