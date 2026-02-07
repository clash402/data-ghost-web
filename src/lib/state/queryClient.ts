import { QueryClient } from "@tanstack/react-query";

export const queryKeys = {
  datasetSummary: ["dataset-summary"] as const,
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
