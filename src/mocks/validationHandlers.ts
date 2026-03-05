import { http, HttpResponse } from 'msw'

/**
 * Mock email validation database (simulating checked emails)
 */
const registeredEmails = new Set([
  'alice@example.com',
  'bob@example.com',
  'carlos@example.com',
  'existing@company.com',
])

/**
 * Mock username validation database
 */
const registeredUsernames = new Set([
  'alice_dev',
  'bob_engineer',
  'carlos_senior',
  'admin',
])

/**
 * Validation handlers for form validation endpoints
 *
 * Provides MSW handlers for common async validation scenarios:
 * - Email uniqueness checking
 * - Username availability checking
 * - Password strength validation
 *
 * @example
 * ```tsx
 * // In your test or development setup
 * import { validationHandlers } from '@/mocks/validationHandlers'
 * import { setupServer } from 'msw/node'
 *
 * const server = setupServer(...validationHandlers)
 * server.listen()
 * ```
 */
export const validationHandlers = [
  /**
   * Check email availability
   * POST /api/validate/email
   * Request: { email: string }
   * Response: { available: boolean, message?: string }
   */
  http.post('/api/validate/email', async ({ request }) => {
    try {
      const body = (await request.json()) as { email: string }
      const { email } = body

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return HttpResponse.json(
          {
            available: false,
            message: 'Invalid email format',
          },
          { status: 400 },
        )
      }

      // Check if email is registered
      const isRegistered = registeredEmails.has(email.toLowerCase())

      return HttpResponse.json(
        {
          available: !isRegistered,
          message: isRegistered
            ? 'This email is already registered'
            : 'Email is available',
        },
        { status: 200 },
      )
    } catch (error) {
      return HttpResponse.json(
        {
          available: false,
          message: 'Error validating email',
        },
        { status: 500 },
      )
    }
  }),

  /**
   * Check username availability
   * POST /api/validate/username
   * Request: { username: string }
   * Response: { available: boolean, message?: string }
   */
  http.post('/api/validate/username', async ({ request }) => {
    try {
      const body = (await request.json()) as { username: string }
      const { username } = body

      // Username format validation (3+ alphanumeric, underscores, hyphens)
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
      if (!usernameRegex.test(username)) {
        return HttpResponse.json(
          {
            available: false,
            message:
              'Username must be 3-20 characters and contain only alphanumeric, underscores, or hyphens',
          },
          { status: 400 },
        )
      }

      // Check if username is taken
      const isTaken = registeredUsernames.has(username.toLowerCase())

      return HttpResponse.json(
        {
          available: !isTaken,
          message: isTaken ? 'This username is already taken' : 'Username is available',
        },
        { status: 200 },
      )
    } catch (error) {
      return HttpResponse.json(
        {
          available: false,
          message: 'Error validating username',
        },
        { status: 500 },
      )
    }
  }),

  /**
   * Validate password strength
   * POST /api/validate/password
   * Request: { password: string }
   * Response: { strength: 'weak' | 'medium' | 'strong', score: number, feedback: string[] }
   */
  http.post('/api/validate/password', async ({ request }) => {
    try {
      const body = (await request.json()) as { password: string }
      const { password } = body

      if (!password || password.length === 0) {
        return HttpResponse.json(
          {
            strength: 'weak',
            score: 0,
            feedback: ['Password is required'],
          },
          { status: 400 },
        )
      }

      const feedback: string[] = []
      let score = 0

      // Check length
      if (password.length >= 8) {
        score += 1
      } else {
        feedback.push('Password should be at least 8 characters')
      }

      // Check for uppercase
      if (/[A-Z]/.test(password)) {
        score += 1
      } else {
        feedback.push('Add uppercase letters for better security')
      }

      // Check for lowercase
      if (/[a-z]/.test(password)) {
        score += 1
      } else {
        feedback.push('Add lowercase letters for better security')
      }

      // Check for numbers
      if (/\d/.test(password)) {
        score += 1
      } else {
        feedback.push('Add numbers for better security')
      }

      // Check for special characters
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        score += 1
      } else {
        feedback.push('Special characters increase security')
      }

      const strength = score >= 4 ? 'strong' : score >= 2 ? 'medium' : 'weak'

      return HttpResponse.json(
        {
          strength,
          score,
          feedback,
        },
        { status: 200 },
      )
    } catch (error) {
      return HttpResponse.json(
        {
          strength: 'weak',
          score: 0,
          feedback: ['Error validating password'],
        },
        { status: 500 },
      )
    }
  }),

  /**
   * Generic validation endpoint
   * POST /api/validate/:field
   * Validates custom field rules
   */
  http.post('/api/validate/team-name', async ({ request }) => {
    try {
      const body = (await request.json()) as { value: string }
      const { value } = body

      // Team name validation
      if (value.length < 2) {
        return HttpResponse.json(
          {
            valid: false,
            message: 'Team name must be at least 2 characters',
          },
          { status: 400 },
        )
      }

      if (value.length > 100) {
        return HttpResponse.json(
          {
            valid: false,
            message: 'Team name must not exceed 100 characters',
          },
          { status: 400 },
        )
      }

      // Check for profanity/reserved words (simplified)
      const reserved = ['admin', 'system', 'root', 'test']
      const isReserved = reserved.some((word) => value.toLowerCase().includes(word))

      if (isReserved) {
        return HttpResponse.json(
          {
            valid: false,
            message: 'This team name is reserved',
          },
          { status: 400 },
        )
      }

      return HttpResponse.json(
        {
          valid: true,
          message: 'Team name is valid',
        },
        { status: 200 },
      )
    } catch (error) {
      return HttpResponse.json(
        {
          valid: false,
          message: 'Error validating team name',
        },
        { status: 500 },
      )
    }
  }),
]
