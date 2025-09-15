import { DimUser } from "@/lib/db/schema";
import { endpoints } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "./fetchers";

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<DimUser>(
    endpoints.user,
    fetcher
  );

  return { user: data, error, isLoading, mutate };
}
