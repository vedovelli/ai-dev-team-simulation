import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { OnboardingProgress, OnboardingStepId } from '../types/onboarding'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Query key factory for onboarding
 * Ensures consistency across hooks that access onboarding cache
 */
export const onboardingQueryKeys = {
  all: ['onboarding'] as const,
  progress: () => [...onboardingQueryKeys.all, 'progress'] as const,
}

/**
 * All available onboarding steps
 */
const REQUIRED_STEPS: OnboardingStepId[] = ['profile', 'notifications', 'workspace']

/**
 * Configuration options for useOnboarding hook
 */
export interface UseOnboardingOptions {
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
  /** Refetch interval in milliseconds (default: disabled) */
  refetchInterval?: number | false
}

/**
 * Manage onboarding flow with simple step tracking
 *
 * Features:
 * - Fetch onboarding progress from /api/onboarding/progress
 * - Track completed and skipped steps
 * - Mutations: completeStep(stepId), skipStep(stepId)
 * - Optimistic updates with cache invalidation
 * - Computed flags: canSkip, isDone, progress (percentage)
 * - TanStack Query with stale-while-revalidate strategy
 * - Exponential backoff retry logic
 */
export function useOnboarding(options: UseOnboardingOptions = {}) {
  const {
    refetchOnWindowFocus = true,
    refetchInterval = false,
  } = options

  const queryClient = useQueryClient()

  // Fetch onboarding progress
  const query = useQuery<OnboardingProgress, Error>({
    queryKey: onboardingQueryKeys.progress(),
    queryFn: async () => {
      const response = await fetch('/api/onboarding/progress', {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch onboarding progress: ${response.statusText}`)
      }

      return response.json() as Promise<OnboardingProgress>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
    refetchOnWindowFocus,
    refetchInterval,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Mutation for completing a step
  const completeStepMutation = useMutationWithRetry<
    { success: boolean; progress: OnboardingProgress },
    { stepId: OnboardingStepId }
  >({
    mutationFn: async ({ stepId }) => {
      const response = await fetch('/api/onboarding/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, action: 'complete' }),
      })

      if (!response.ok) {
        throw new Error(`Failed to complete step: ${response.statusText}`)
      }

      return response.json()
    },
    onMutate: async ({ stepId }) => {
      // Cancel pending requests
      await queryClient.cancelQueries({ queryKey: onboardingQueryKeys.progress() })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<OnboardingProgress>(
        { queryKey: onboardingQueryKeys.progress() }
      )

      // Optimistic update
      if (previousData) {
        const updated: OnboardingProgress = {
          ...previousData,
          completedSteps: Array.from(new Set([...previousData.completedSteps, stepId])),
          skippedSteps: previousData.skippedSteps.filter((s) => s !== stepId),
          lastUpdated: new Date().toISOString(),
        }
        queryClient.setQueryData(onboardingQueryKeys.progress(), updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(onboardingQueryKeys.progress(), context.previousData)
      }
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.progress() })
    },
  })

  // Mutation for skipping a step
  const skipStepMutation = useMutationWithRetry<
    { success: boolean; progress: OnboardingProgress },
    { stepId: OnboardingStepId }
  >({
    mutationFn: async ({ stepId }) => {
      const response = await fetch('/api/onboarding/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, action: 'skip' }),
      })

      if (!response.ok) {
        throw new Error(`Failed to skip step: ${response.statusText}`)
      }

      return response.json()
    },
    onMutate: async ({ stepId }) => {
      // Cancel pending requests
      await queryClient.cancelQueries({ queryKey: onboardingQueryKeys.progress() })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<OnboardingProgress>(
        { queryKey: onboardingQueryKeys.progress() }
      )

      // Optimistic update
      if (previousData) {
        const updated: OnboardingProgress = {
          ...previousData,
          skippedSteps: Array.from(new Set([...previousData.skippedSteps, stepId])),
          completedSteps: previousData.completedSteps.filter((s) => s !== stepId),
          lastUpdated: new Date().toISOString(),
        }
        queryClient.setQueryData(onboardingQueryKeys.progress(), updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(onboardingQueryKeys.progress(), context.previousData)
      }
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.progress() })
    },
  })

  // Get current progress data
  const progress = query.data || { completedSteps: [], skippedSteps: [], startedAt: '', lastUpdated: '' }

  // Compute isDone: all required steps are completed
  const isDone = REQUIRED_STEPS.every((step) => progress.completedSteps.includes(step))

  // Compute progress percentage
  const completedCount = progress.completedSteps.length
  const totalSteps = REQUIRED_STEPS.length
  const progressPercentage = Math.round((completedCount / totalSteps) * 100)

  // Get current step (first incomplete step)
  const currentStep = REQUIRED_STEPS.find(
    (step) => !progress.completedSteps.includes(step) && !progress.skippedSteps.includes(step)
  )

  // Determine if user can skip (all steps are currently skippable in v1)
  const canSkip = true

  /**
   * Complete a step and update cache
   */
  const completeStep = (stepId: OnboardingStepId) => {
    completeStepMutation.mutate({ stepId })
  }

  /**
   * Skip a step and update cache
   */
  const skipStep = (stepId: OnboardingStepId) => {
    skipStepMutation.mutate({ stepId })
  }

  return {
    // Query state
    isLoading: query.isLoading,
    error: query.error,
    status: query.status,

    // Onboarding data
    progress: progressPercentage,
    completedSteps: progress.completedSteps,
    skippedSteps: progress.skippedSteps,
    currentStep,

    // Flags
    canSkip,
    isDone,

    // Actions
    completeStep,
    skipStep,

    // Mutation state
    isCompleting: completeStepMutation.isLoading,
    completeError: completeStepMutation.error,
    isSkipping: skipStepMutation.isLoading,
    skipError: skipStepMutation.error,
  }
}

export type UseOnboardingReturn = ReturnType<typeof useOnboarding>
