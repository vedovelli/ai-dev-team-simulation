import { http, HttpResponse, delay } from 'msw'

/**
 * Error simulation request
 */
export interface ErrorSimulationRequest {
  /** Error code to simulate (e.g., 500, 503, timeout) */
  errorCode: 'NETWORK_ERROR' | 'TIMEOUT' | 'SERVER_ERROR' | 'RATE_LIMIT'
  /** Context where error occurred (e.g., 'notifications', 'taskAssignment') */
  context?: string
  /** Custom error message */
  message?: string
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: {
    code: string
    message: string
    context?: string
    timestamp: string
  }
}

/**
 * Simulate different error scenarios
 * Used for testing error handling and retry logic
 *
 * Delays: 200ms+ as specified in requirements
 */
export const errorsHandlers = [
  /**
   * POST /api/errors/simulate
   *
   * Simulates various error scenarios for testing recovery flows
   *
   * Request body:
   * {
   *   "errorCode": "NETWORK_ERROR" | "TIMEOUT" | "SERVER_ERROR" | "RATE_LIMIT",
   *   "context": "notifications" | "taskAssignment" | etc,
   *   "message": "Custom error message"
   * }
   *
   * Returns appropriate HTTP error status with realistic delay
   */
  http.post('/api/errors/simulate', async ({ request }) => {
    // Simulate network latency (200ms minimum as per spec)
    await delay(200 + Math.random() * 300)

    let body: ErrorSimulationRequest

    try {
      body = (await request.json()) as ErrorSimulationRequest
    } catch {
      return HttpResponse.json<ErrorResponse>(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Request body must be valid JSON',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      )
    }

    const { errorCode, context, message } = body
    const timestamp = new Date().toISOString()

    // Simulate different error scenarios
    switch (errorCode) {
      case 'NETWORK_ERROR':
        // Use HttpResponse.networkError() to properly simulate network failures
        return HttpResponse.networkError('Network connection failed')

      case 'TIMEOUT':
        return HttpResponse.json<ErrorResponse>(
          {
            error: {
              code: 'TIMEOUT',
              message: message || 'Request timeout',
              context,
              timestamp,
            },
          },
          { status: 408 }
        )

      case 'SERVER_ERROR':
        return HttpResponse.json<ErrorResponse>(
          {
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: message || 'Internal server error',
              context,
              timestamp,
            },
          },
          { status: 500 }
        )

      case 'RATE_LIMIT':
        return HttpResponse.json<ErrorResponse>(
          {
            error: {
              code: 'TOO_MANY_REQUESTS',
              message: message || 'Rate limit exceeded',
              context,
              timestamp,
            },
          },
          { status: 429, headers: { 'Retry-After': '60' } }
        )

      default:
        return HttpResponse.json<ErrorResponse>(
          {
            error: {
              code: 'UNKNOWN_ERROR',
              message: message || 'An unknown error occurred',
              context,
              timestamp,
            },
          },
          { status: 500 }
        )
    }
  }),

  /**
   * GET /api/errors/health
   *
   * Health check endpoint for testing error handling
   * Returns 200 on success, can be used to verify error recovery
   */
  http.get('/api/errors/health', async () => {
    // Simulate minimal network latency
    await delay(50 + Math.random() * 50)

    return HttpResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  }),
]

/**
 * Helper to simulate an error and test recovery
 * Used in tests and error handling workflows
 */
export async function simulateError(
  errorCode: ErrorSimulationRequest['errorCode'],
  context?: string,
  message?: string
): Promise<void> {
  try {
    const response = await fetch('/api/errors/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorCode,
        context,
        message,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`${error.error.code}: ${error.error.message}`)
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(`Failed to simulate error: ${String(error)}`)
  }
}
