/**
 * MSW Error Scenario Handlers
 * Demonstrates various error scenarios for form submission and network failures
 * - Network timeout (delayed response)
 * - Server error (500)
 * - Validation error (400)
 * - Unauthorized (401)
 */

import { http, HttpResponse, delay } from 'msw'

/**
 * Error scenario handlers for testing error UI and toast system
 * These handlers intentionally return errors for specific endpoints
 */
export const errorScenarioHandlers = [
  /**
   * Network timeout scenario
   * POST /api/tasks/timeout
   * Simulates a slow/timeout network request
   */
  http.post('/api/tasks/timeout', async () => {
    // Simulate network delay
    await delay(6000)
    return HttpResponse.json(
      {
        error: 'Request timeout',
        message: 'The request took too long to complete',
      },
      { status: 408 },
    )
  }),

  /**
   * Server error scenario
   * POST /api/tasks/server-error
   * Returns a 500 Internal Server Error
   */
  http.post('/api/tasks/server-error', () => {
    return HttpResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Something went wrong on the server. Please try again later.',
      },
      { status: 500 },
    )
  }),

  /**
   * Validation error scenario
   * POST /api/tasks/validation-error
   * Returns a 400 Bad Request with validation errors
   */
  http.post('/api/tasks/validation-error', () => {
    return HttpResponse.json(
      {
        error: 'Validation Error',
        message: 'Please fix the errors and try again',
        details: {
          name: 'Task name is required',
          team: 'Team must be selected',
          priority: 'Priority must be specified',
        },
      },
      { status: 400 },
    )
  }),

  /**
   * Unauthorized scenario
   * POST /api/tasks/unauthorized
   * Returns a 401 Unauthorized error
   */
  http.post('/api/tasks/unauthorized', () => {
    return HttpResponse.json(
      {
        error: 'Unauthorized',
        message: 'You are not authorized to perform this action',
      },
      { status: 401 },
    )
  }),

  /**
   * Forbidden scenario
   * POST /api/tasks/forbidden
   * Returns a 403 Forbidden error
   */
  http.post('/api/tasks/forbidden', () => {
    return HttpResponse.json(
      {
        error: 'Forbidden',
        message: 'You do not have permission to create tasks in this team',
      },
      { status: 403 },
    )
  }),

  /**
   * Not found scenario
   * POST /api/tasks/not-found
   * Returns a 404 Not Found error
   */
  http.post('/api/tasks/not-found', () => {
    return HttpResponse.json(
      {
        error: 'Not Found',
        message: 'The requested resource was not found',
      },
      { status: 404 },
    )
  }),
]
