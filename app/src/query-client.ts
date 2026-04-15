import { QueryClient } from "@tanstack/vue-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  sessions: ["sessions"] as const,
  history: (sessionId: string) => ["history", sessionId] as const,
  files: ["files"] as const,
};
