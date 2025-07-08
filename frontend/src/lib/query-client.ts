import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        const axiosError = error as { response?: { status?: number } };
        if (axiosError?.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});