import { http } from 'msw'

/**
 * Get the configured latency delay in milliseconds
 * - Reads from VITE_MSW_LATENCY environment variable
 * - Default: 0ms in test environment, configurable in dev
 * - Format: "min-max" (e.g., "50-200")
 * - Returns: [min, max] tuple for random delay
 */
function getLatencyConfig(): [number, number] {
  const latencyEnv = import.meta.env.VITE_MSW_LATENCY || ''

  // Extract min-max format
  const match = latencyEnv.match(/(\d+)-(\d+)/)
  if (match) {
    return [parseInt(match[1], 10), parseInt(match[2], 10)]
  }

  return [0, 0] // No latency by default
}

/**
 * Generate a random delay within the configured range
 */
function getRandomDelay(): number {
  const [min, max] = getLatencyConfig()
  if (min === 0 && max === 0) return 0
  return Math.random() * (max - min) + min
}

/**
 * MSW latency middleware
 *
 * Adds realistic latency to all /api/* responses for profiling and testing.
 * Latency range is configured via VITE_MSW_LATENCY environment variable.
 *
 * Features:
 * - Configurable latency via env var (format: "50-200")
 * - Opt-in: off by default in tests, configurable in dev
 * - Applied as a passthrough middleware
 * - Works with all HTTP methods and handlers
 *
 * Usage:
 * Add to MSW handler setup in setupServer or setupWorker:
 * ```typescript
 * export const handlers = [
 *   latencyMiddleware,
 *   ...otherHandlers,
 * ]
 * ```
 *
 * Configure latency:
 * ```bash
 * VITE_MSW_LATENCY=50-200 npm run dev  # 50-200ms latency
 * ```
 */
export const latencyMiddleware = http.all('/api/*', async ({ request, passthrough }) => {
  const delay = getRandomDelay()

  // Apply the delay before passing through
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  return passthrough()
})

/**
 * Add latency to a single handler response
 * Useful for adding latency to specific endpoints
 *
 * Usage:
 * ```typescript
 * http.get('/api/data', async (info) => {
 *   const delay = getRandomDelay()
 *   if (delay > 0) await new Promise(r => setTimeout(r, delay))
 *   return HttpResponse.json({ ... })
 * })
 * ```
 */
export function addLatency(delay?: number): Promise<void> {
  const actualDelay = delay ?? getRandomDelay()
  if (actualDelay > 0) {
    return new Promise((resolve) => setTimeout(resolve, actualDelay))
  }
  return Promise.resolve()
}
