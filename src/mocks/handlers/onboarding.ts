import { http, HttpResponse } from 'msw'
import type {
  OnboardingProgress,
  OnboardingStepId,
  OnboardingStepResponse,
  CompleteStepRequest,
  SkipStepRequest,
} from '../../types/onboarding'

/**
 * In-memory store for onboarding progress
 * Simulates server-side persistence within a single session
 */
let mockProgress: OnboardingProgress = {
  completedSteps: [],
  skippedSteps: [],
  startedAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
}

/**
 * All available onboarding steps
 */
const REQUIRED_STEPS: OnboardingStepId[] = ['profile', 'notifications', 'workspace']

/**
 * MSW handlers for onboarding endpoints
 */
export const onboardingHandlers = [
  /**
   * GET /api/onboarding/progress
   * Fetch current onboarding progress
   */
  http.get('/api/onboarding/progress', () => {
    return HttpResponse.json<OnboardingProgress>(mockProgress)
  }),

  /**
   * PATCH /api/onboarding/progress
   * Complete or skip a step
   */
  http.patch('/api/onboarding/progress', async (info) => {
    const body = (await info.request.json()) as { stepId: OnboardingStepId; action: 'complete' | 'skip' }

    const { stepId, action } = body

    // Validate step ID
    if (!REQUIRED_STEPS.includes(stepId)) {
      return HttpResponse.json(
        { error: `Invalid step ID: ${stepId}` },
        { status: 400 }
      )
    }

    // Simulate 200ms network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Update progress based on action
    if (action === 'complete') {
      mockProgress = {
        ...mockProgress,
        completedSteps: Array.from(new Set([...mockProgress.completedSteps, stepId])),
        skippedSteps: mockProgress.skippedSteps.filter((s) => s !== stepId),
        lastUpdated: new Date().toISOString(),
      }
    } else if (action === 'skip') {
      // Can only skip optional steps, but all steps in v1 are optional
      mockProgress = {
        ...mockProgress,
        skippedSteps: Array.from(new Set([...mockProgress.skippedSteps, stepId])),
        completedSteps: mockProgress.completedSteps.filter((s) => s !== stepId),
        lastUpdated: new Date().toISOString(),
      }
    }

    return HttpResponse.json<OnboardingStepResponse>({
      success: true,
      progress: mockProgress,
    })
  }),

  /**
   * POST /api/onboarding/progress/reset
   * Reset onboarding progress (for testing)
   */
  http.post('/api/onboarding/progress/reset', () => {
    mockProgress = {
      completedSteps: [],
      skippedSteps: [],
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }

    return HttpResponse.json<OnboardingProgress>(mockProgress)
  }),
]
