import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // 2 min
      gcTime: 1000 * 60 * 10,         // 10 min
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query key factories for consistency
export const queryKeys = {
  moves: {
    all: ['moves'] as const,
    nearby: (lat: number, lng: number, radius: number, category: string | null) =>
      ['moves', 'nearby', lat, lng, radius, category] as const,
    detail: (id: string) => ['moves', 'detail', id] as const,
    byUser: (userId: string) => ['moves', 'by-user', userId] as const,
    myUpcoming: () => ['moves', 'my-upcoming'] as const,
  },
  rsvps: {
    forMove: (moveId: string) => ['rsvps', moveId] as const,
    myStatus: (moveId: string) => ['rsvps', 'my-status', moveId] as const,
  },
  profiles: {
    detail: (id: string) => ['profiles', id] as const,
    me: () => ['profiles', 'me'] as const,
  },
};
