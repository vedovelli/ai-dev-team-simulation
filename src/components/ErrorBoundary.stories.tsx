import type { Meta, StoryObj } from '@storybook/react'
import { ErrorBoundary, QueryErrorBoundary, MutationError, LoadingSpinner, EmptyState } from './ErrorBoundary'
import { ErrorFallback } from './ErrorFallback'
import { LoadingFallback } from './LoadingFallback'
import { ToastProvider } from '../contexts/ToastContext'

const meta = {
  title: 'Components/Error & Loading States',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * ErrorBoundary with custom fallback using ErrorFallback component
 */
export const ErrorBoundaryWithFallback: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <ErrorBoundary
        fallback={(error, retry) => (
          <ErrorFallback
            error={error}
            onRetry={retry}
            title="Failed to load notifications"
            message="We couldn't fetch your notifications. Please try again or reload the page."
          />
        )}
      >
        <div className="p-4 border border-green-500 rounded bg-green-50">
          <p>This content would render if there was no error</p>
        </div>
      </ErrorBoundary>
    </div>
  ),
}

/**
 * ErrorBoundary with default error UI
 */
export const ErrorBoundaryDefault: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <ErrorBoundary>
        <div className="p-4 border border-green-500 rounded bg-green-50">
          <p>This content would render if there was no error</p>
        </div>
      </ErrorBoundary>
    </div>
  ),
}

/**
 * QueryErrorBoundary showing loading state
 */
export const QueryErrorBoundaryLoading: Story = {
  render: () => (
    <QueryErrorBoundary isLoading={true}>
      <div>This content won't be visible</div>
    </QueryErrorBoundary>
  ),
}

/**
 * QueryErrorBoundary showing error state
 */
export const QueryErrorBoundaryError: Story = {
  render: () => (
    <QueryErrorBoundary
      error={new Error('Failed to fetch data from server')}
      onRetry={() => console.log('Retrying...')}
    >
      <div>This content won't be visible</div>
    </QueryErrorBoundary>
  ),
}

/**
 * ErrorFallback component standalone
 */
export const ErrorFallbackStandalone: Story = {
  render: () => (
    <ErrorFallback
      error={new Error('Network error: Unable to connect to server')}
      isRetrying={false}
      onRetry={() => console.log('Retrying...')}
      title="Failed to load dashboard"
      message="We encountered a network error while loading your dashboard. Please try again."
    />
  ),
}

/**
 * ErrorFallback showing retrying state
 */
export const ErrorFallbackRetrying: Story = {
  render: () => (
    <ErrorFallback
      error={new Error('Connection timeout')}
      isRetrying={true}
      onRetry={() => {}}
      title="Retrying connection..."
      message="We are attempting to reconnect to the server."
    />
  ),
}

/**
 * LoadingFallback with table variant
 */
export const LoadingFallbackTable: Story = {
  render: () => (
    <LoadingFallback
      variant="table"
      rowCount={5}
      message="Loading table data..."
    />
  ),
}

/**
 * LoadingFallback with card variant
 */
export const LoadingFallbackCard: Story = {
  render: () => (
    <LoadingFallback
      variant="card"
      rowCount={6}
      message="Loading cards..."
    />
  ),
}

/**
 * LoadingFallback with list variant
 */
export const LoadingFallbackList: Story = {
  render: () => (
    <LoadingFallback
      variant="list"
      rowCount={4}
      message="Loading list items..."
    />
  ),
}

/**
 * MutationError component
 */
export const MutationErrorStandalone: Story = {
  render: () => (
    <MutationError
      error={new Error('Failed to update task')}
      onDismiss={() => console.log('Dismissed')}
    />
  ),
}

/**
 * LoadingSpinner component
 */
export const LoadingSpinnerSmall: Story = {
  render: () => (
    <LoadingSpinner message="Loading..." size="sm" />
  ),
}

export const LoadingSpinnerMedium: Story = {
  render: () => (
    <LoadingSpinner message="Loading..." size="md" />
  ),
}

export const LoadingSpinnerLarge: Story = {
  render: () => (
    <LoadingSpinner message="Loading..." size="lg" />
  ),
}

/**
 * EmptyState component
 */
export const EmptyStateStandalone: Story = {
  render: () => (
    <EmptyState
      title="No notifications"
      message="You don't have any notifications yet"
      action={{
        label: 'Go to settings',
        onClick: () => console.log('Navigate to settings'),
      }}
    />
  ),
}

/**
 * Complete error handling workflow example
 */
export const ErrorHandlingWorkflow: Story = {
  render: () => (
    <div className="w-full max-w-4xl space-y-8">
      <div>
        <h3 className="text-lg font-bold mb-4">Loading State</h3>
        <LoadingFallback variant="table" rowCount={3} />
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">Error State with Retry</h3>
        <ErrorFallback
          error={new Error('Failed to fetch notifications')}
          isRetrying={false}
          onRetry={() => console.log('Retrying...')}
          title="Cannot load notifications"
          message="We encountered an error while loading your notifications. Please try again."
        />
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">Success State (Empty)</h3>
        <EmptyState
          title="No new notifications"
          message="Check back later for new updates"
        />
      </div>
    </div>
  ),
}
