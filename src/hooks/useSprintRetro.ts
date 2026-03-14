import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { SprintRetro } from '../types/retro';

interface UseSprintRetroReturn {
  retro: SprintRetro | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useSprintRetro(sprintId: string): UseSprintRetroReturn {
  const {
    data: retro,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['sprints', sprintId, 'retro'],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/retro`);
      if (!response.ok) {
        throw new Error(`Failed to fetch retro for sprint ${sprintId}`);
      }
      return response.json() as Promise<SprintRetro>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex: number) => {
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
  }) as UseQueryResult<SprintRetro>;

  return {
    retro,
    isLoading,
    isError,
    refetch: () => refetch(),
  };
}
