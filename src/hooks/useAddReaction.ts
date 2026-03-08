import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactionEmoji, ActivityEvent } from '../types/activity'

interface UseAddReactionOptions {
  eventId: string
}

/**
 * Custom hook for adding reactions to activity events.
 *
 * Features:
 * - Optimistic updates for instant feedback
 * - Automatic cache invalidation
 * - Rollback on error
 *
 * @param options - Configuration including event ID
 * @returns Mutation function to add reaction
 *
 * @example
 * ```tsx
 * const { mutate: addReaction } = useAddReaction({ eventId: 'evt-1' })
 * addReaction('👍')
 * ```
 */
export function useAddReaction({ eventId }: UseAddReactionOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (emoji: ReactionEmoji) => {
      const response = await fetch(`/api/activity/${eventId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })

      if (!response.ok) {
        throw new Error('Failed to add reaction')
      }

      const data = await response.json()
      return data.data as ActivityEvent
    },

    // Optimistic update
    onMutate: async (emoji: ReactionEmoji) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['activity', 'feed'] })

      // Get current feed data
      const feedData = queryClient.getQueryData<ActivityEvent[]>([
        'activity',
        'feed',
      ])

      // Snapshot the previous value
      const previousData = feedData

      // Optimistically update the cache
      if (feedData) {
        const updatedFeed = feedData.map((event) => {
          if (event.id === eventId) {
            const reactions = event.reactions || {}
            return {
              ...event,
              reactions: {
                ...reactions,
                [emoji]: (reactions[emoji] || 0) + 1,
              },
            }
          }
          return event
        })

        queryClient.setQueryData(['activity', 'feed'], updatedFeed)
      }

      return { previousData }
    },

    // Revert on error
    onError: (err, emoji, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['activity', 'feed'], context.previousData)
      }
    },

    // Refetch after success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', 'feed'] })
    },
  })
}
