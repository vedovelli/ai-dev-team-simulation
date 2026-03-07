/**
 * Example: Using useResilientQuery Hook
 *
 * This component demonstrates how to use the useResilientQuery hook
 * for fetching user data with production-ready resilience patterns.
 *
 * Features demonstrated:
 * - Configurable retry policies
 * - Circuit breaker failure handling
 * - Manual retry functionality
 * - Success/error callbacks
 * - TypeScript generics for type safety
 */

import { useResilientQuery } from '@/hooks'

interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
}

interface ResilientQueryExampleProps {
  userId: number
}

/**
 * Simulated API call to fetch user data
 * In production, this would be a real API call
 */
async function fetchUser(userId: number): Promise<User> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Simulate occasional failures for demo purposes
  if (Math.random() > 0.8) {
    throw new Error('Failed to fetch user')
  }

  return {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    status: 'active',
  }
}

/**
 * Example component using useResilientQuery
 *
 * This demonstrates:
 * 1. Basic hook usage with query key and function
 * 2. Custom retry configuration
 * 3. Handling circuit breaker state
 * 4. Manual retry capability
 * 5. Callbacks for success/error
 */
export function ResilientQueryExample({
  userId,
}: ResilientQueryExampleProps) {
  const { data, isLoading, error, isCircuitBreakerOpen, retry } =
    useResilientQuery<User>({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
      retryConfig: {
        // Retry up to 3 times
        maxAttempts: 3,
        // Start with 1 second delay
        baseDelay: 1000,
        // Cap at 10 seconds
        maxDelay: 10000,
        // Circuit breaker opens after 5 consecutive failures
        circuitBreakerThreshold: 5,
      },
      onSuccess: (user) => {
        console.log('User loaded successfully:', user)
      },
      onError: (error) => {
        console.error('Failed to load user:', error)
      },
    })

  // Handle circuit breaker state
  if (isCircuitBreakerOpen) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-lg">
        <h3 className="font-semibold">Service Temporarily Unavailable</h3>
        <p className="text-sm mt-2">
          Too many failures. The service is taking a break. Try again later.
        </p>
        <button
          onClick={retry}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="p-4 bg-blue-100 text-blue-800 rounded-lg">
        <p>Loading user data...</p>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
        <h3 className="font-semibold">Failed to Load User</h3>
        <p className="text-sm mt-2">{error.message}</p>
        <button
          onClick={retry}
          className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // Display user data
  if (!data) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p>No user data available</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h2 className="text-xl font-semibold text-green-900">{data.name}</h2>
      <div className="mt-3 space-y-2 text-sm text-green-800">
        <p>
          <span className="font-semibold">ID:</span> {data.id}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {data.email}
        </p>
        <p>
          <span className="font-semibold">Status:</span>{' '}
          <span
            className={`px-2 py-1 rounded ${
              data.status === 'active'
                ? 'bg-green-200 text-green-900'
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            {data.status}
          </span>
        </p>
      </div>
      <button
        onClick={retry}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Refresh
      </button>
    </div>
  )
}

/**
 * Usage in application:
 *
 * import { ResilientQueryExample } from '@/components/ResilientQueryExample'
 *
 * export function UserProfile() {
 *   return <ResilientQueryExample userId={123} />
 * }
 */
