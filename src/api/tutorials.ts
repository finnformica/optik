import { endpoints } from "@/lib/utils";
import { TutorialCategory } from "@/types/tutorials";
import useSWR from "swr";
import { fetcher } from "./fetchers";

export function useTutorials() {
  const { data, error, isLoading } = useSWR<TutorialCategory[]>(
    endpoints.tutorials,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    },
  );

  return {
    tutorials: data || [],
    isLoading,
    isError: error,
  };
}
