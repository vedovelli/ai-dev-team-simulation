import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RetroItem, CreateRetroItemRequest, UpdateRetroItemRequest } from '../types/retro';

export function useRetroItemMutations(sprintId: string) {
  const queryClient = useQueryClient();

  const createItem = useMutation({
    mutationFn: async (item: CreateRetroItemRequest) => {
      const response = await fetch(`/api/sprints/${sprintId}/retro/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        throw new Error('Failed to create retro item');
      }
      return response.json() as Promise<RetroItem>;
    },
    onMutate: async (newItem) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['sprints', sprintId, 'retro'] });

      // Snapshot the previous value
      const previousRetro = queryClient.getQueryData(['sprints', sprintId, 'retro']);

      // Optimistically update cache
      queryClient.setQueryData(['sprints', sprintId, 'retro'], (old: any) => {
        const optimisticItem: RetroItem = {
          id: `temp-${Date.now()}`,
          sprintId,
          type: newItem.type,
          text: newItem.text,
          author: { id: 'temp', name: 'You', email: 'user@example.com' },
          votes: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          ...old,
          items: [...(old?.items || []), optimisticItem],
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousRetro };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous value
      if (context?.previousRetro) {
        queryClient.setQueryData(['sprints', sprintId, 'retro'], context.previousRetro);
      }
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['sprints', sprintId, 'retro'] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdateRetroItemRequest }) => {
      const response = await fetch(`/api/sprints/${sprintId}/retro/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        throw new Error('Failed to update retro item');
      }
      return response.json() as Promise<RetroItem>;
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['sprints', sprintId, 'retro'] });

      const previousRetro = queryClient.getQueryData(['sprints', sprintId, 'retro']);

      queryClient.setQueryData(['sprints', sprintId, 'retro'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item: RetroItem) =>
            item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
          ),
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousRetro };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRetro) {
        queryClient.setQueryData(['sprints', sprintId, 'retro'], context.previousRetro);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', sprintId, 'retro'] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sprints/${sprintId}/retro/items/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete retro item');
      }
      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['sprints', sprintId, 'retro'] });

      const previousRetro = queryClient.getQueryData(['sprints', sprintId, 'retro']);

      queryClient.setQueryData(['sprints', sprintId, 'retro'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((item: RetroItem) => item.id !== id),
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousRetro };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRetro) {
        queryClient.setQueryData(['sprints', sprintId, 'retro'], context.previousRetro);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', sprintId, 'retro'] });
    },
  });

  const voteItem = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sprints/${sprintId}/retro/items/${id}/vote`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Failed to vote on retro item');
      }
      return response.json() as Promise<RetroItem>;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['sprints', sprintId, 'retro'] });

      const previousRetro = queryClient.getQueryData(['sprints', sprintId, 'retro']);

      queryClient.setQueryData(['sprints', sprintId, 'retro'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item: RetroItem) =>
            item.id === id ? { ...item, votes: item.votes + 1, updatedAt: new Date().toISOString() } : item
          ),
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousRetro };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRetro) {
        queryClient.setQueryData(['sprints', sprintId, 'retro'], context.previousRetro);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', sprintId, 'retro'] });
    },
  });

  return {
    createItem: createItem.mutate,
    updateItem: updateItem.mutate,
    deleteItem: deleteItem.mutate,
    voteItem: voteItem.mutate,
    isCreating: createItem.isPending,
    isUpdating: updateItem.isPending,
    isDeleting: deleteItem.isPending,
    isVoting: voteItem.isPending,
    createError: createItem.error,
    updateError: updateItem.error,
    deleteError: deleteItem.error,
    voteError: voteItem.error,
  };
}
