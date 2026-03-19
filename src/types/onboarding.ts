/**
 * Onboarding step identifier
 */
export type OnboardingStepId = 'profile' | 'notifications' | 'workspace'

/**
 * Onboarding step definition
 */
export interface OnboardingStep {
  id: OnboardingStepId
  title: string
  description: string
  required: boolean
}

/**
 * Onboarding progress data from the server
 */
export interface OnboardingProgress {
  completedSteps: OnboardingStepId[]
  skippedSteps: OnboardingStepId[]
  startedAt: string
  lastUpdated: string
}

/**
 * Request to complete a step
 */
export interface CompleteStepRequest {
  stepId: OnboardingStepId
}

/**
 * Request to skip a step
 */
export interface SkipStepRequest {
  stepId: OnboardingStepId
}

/**
 * Response from complete/skip operations
 */
export interface OnboardingStepResponse {
  success: boolean
  progress: OnboardingProgress
}
