import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh data window (instant navigation without refetch)
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection cache retention
      refetchOnWindowFocus: false, // Prevents distracting refetches on tab switch
      retry: 1, // Single retry on transient network failures
    },
  },
});
