import { http, HttpResponse } from 'msw'

/**
 * Form submission mock handlers using MSW
 *
 * Provides endpoints for form submission with support for:
 * - Successful submissions
 * - Server-side validation errors
 * - Field-level error responses
 * - Simulated async processing
 *
 * @example
 * ```tsx
 * // Add to your MSW handlers
 * import { formSubmissionHandlers } from '@/mocks/formSubmissionHandlers'
 * import { setupServer } from 'msw/node'
 *
 * const server = setupServer(...formSubmissionHandlers)
 * server.listen()
 * ```
 */

export const formSubmissionHandlers = [
  /**
   * Generic form submission endpoint
   * POST /api/forms/submit
   * Accepts any form data and validates it
   */
  http.post('/api/forms/submit', async ({ request }) => {
    try {
      const body = (await request.json()) as Record<string, unknown>

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Example: reject if required fields are missing
      if (!body.email || !body.name) {
        return HttpResponse.json(
          {
            success: false,
            fieldErrors: {
              ...((!body.email && { email: ['Email is required'] }) || {}),
              ...((!body.name && { name: ['Name is required'] }) || {}),
            },
            serverError: 'Validation failed',
          },
          { status: 400 },
        )
      }

      // Success case
      return HttpResponse.json(
        {
          success: true,
          data: {
            id: Math.random().toString(36).substr(2, 9),
            ...body,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 200 },
      )
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          serverError: 'Form submission failed',
        },
        { status: 500 },
      )
    }
  }),

  /**
   * Specific form submission endpoint with validation
   * POST /api/forms/:formType/submit
   * Validates form-specific rules
   */
  http.post('/api/forms/:formType/submit', async ({ request, params }) => {
    try {
      const { formType } = params
      const body = (await request.json()) as Record<string, unknown>

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Form-type specific validation
      if (formType === 'registration') {
        return handleRegistrationSubmission(body)
      }

      if (formType === 'login') {
        return handleLoginSubmission(body)
      }

      if (formType === 'profile') {
        return handleProfileSubmission(body)
      }

      // Unknown form type
      return HttpResponse.json(
        {
          success: false,
          serverError: `Unknown form type: ${formType}`,
        },
        { status: 400 },
      )
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          serverError: 'Form submission failed',
        },
        { status: 500 },
      )
    }
  }),
]

/**
 * Handle registration form submission
 * Validates email uniqueness and password strength
 */
function handleRegistrationSubmission(body: Record<string, unknown>) {
  const existingEmails = new Set(['alice@example.com', 'bob@example.com'])

  const fieldErrors: Record<string, string[]> = {}

  // Validate email uniqueness
  if (body.email && typeof body.email === 'string') {
    if (existingEmails.has(body.email.toLowerCase())) {
      fieldErrors.email = ['Email already registered']
    }
  }

  // Validate password strength
  if (body.password && typeof body.password === 'string') {
    if (body.password.length < 8) {
      fieldErrors.password = ['Password must be at least 8 characters']
    }
  }

  // Validate name
  if (!body.name) {
    fieldErrors.name = ['Name is required']
  }

  if (Object.keys(fieldErrors).length > 0) {
    return HttpResponse.json(
      {
        success: false,
        fieldErrors,
        serverError: 'Registration validation failed',
      },
      { status: 400 },
    )
  }

  return HttpResponse.json(
    {
      success: true,
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...body,
        createdAt: new Date().toISOString(),
      },
    },
    { status: 201 },
  )
}

/**
 * Handle login form submission
 * Validates credentials
 */
function handleLoginSubmission(body: Record<string, unknown>) {
  const validCredentials = {
    'alice@example.com': 'Password123',
    'bob@example.com': 'SecurePass456',
  }

  const email = body.email as string
  const password = body.password as string

  const fieldErrors: Record<string, string[]> = {}

  if (!email) {
    fieldErrors.email = ['Email is required']
  }

  if (!password) {
    fieldErrors.password = ['Password is required']
  }

  if (
    email &&
    password &&
    validCredentials[email as keyof typeof validCredentials] !== password
  ) {
    return HttpResponse.json(
      {
        success: false,
        serverError: 'Invalid email or password',
      },
      { status: 401 },
    )
  }

  if (Object.keys(fieldErrors).length > 0) {
    return HttpResponse.json(
      {
        success: false,
        fieldErrors,
      },
      { status: 400 },
    )
  }

  return HttpResponse.json(
    {
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: {
          email,
          id: Math.random().toString(36).substr(2, 9),
        },
      },
    },
    { status: 200 },
  )
}

/**
 * Handle profile update submission
 * Validates profile data
 */
function handleProfileSubmission(body: Record<string, unknown>) {
  const fieldErrors: Record<string, string[]> = {}

  if (!body.name) {
    fieldErrors.name = ['Name is required']
  }

  if (body.bio && typeof body.bio === 'string' && body.bio.length > 500) {
    fieldErrors.bio = ['Bio must not exceed 500 characters']
  }

  if (Object.keys(fieldErrors).length > 0) {
    return HttpResponse.json(
      {
        success: false,
        fieldErrors,
        serverError: 'Profile update validation failed',
      },
      { status: 400 },
    )
  }

  return HttpResponse.json(
    {
      success: true,
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...body,
        updatedAt: new Date().toISOString(),
      },
    },
    { status: 200 },
  )
}
