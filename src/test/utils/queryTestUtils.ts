import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, RenderHookOptions } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { server } from '../../mocks/server'

/**
 * Creates a fresh QueryClient with test defaults.
 * Disables retries by default to make tests faster and more predictable.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Wrapper component that provides QueryClientProvider for testing.
 * Pass this to renderHook's wrapper option.
 */
export function createQueryClientWrapper(
  queryClient: QueryClient
): (props: { children: ReactNode }) => JSX.Element {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

/**
 * Renders a hook with QueryClient setup.
 * Simplifies the common pattern of testing query hooks.
 *
 * @example
 * const queryClient = createTestQueryClient()
 * const { result } = renderQueryHook(
 *   () => useUserQuery('1'),
 *   { queryClient }
 * )
 */
export function renderQueryHook<T>(
  hook: () => T,
  options?: {
    queryClient?: QueryClient
    hookOptions?: Omit<RenderHookOptions<unknown>, 'wrapper'>
  }
): ReturnType<typeof renderHook<T>> {
  const queryClient = options?.queryClient || createTestQueryClient()
  const wrapper = createQueryClientWrapper(queryClient)

  return renderHook(hook, {
    wrapper,
    ...options?.hookOptions,
  })
}

/**
 * Adds a request handler that returns a successful response.
 * The handler is added to the MSW server and will be used for subsequent requests.
 *
 * @example
 * mockSuccessResponse(
 *   'GET',
 *   '/api/users/1',
 *   { id: '1', name: 'John' }
 * )
 */
export function mockSuccessResponse<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string | RegExp,
  data: T,
  status: number = 200
): void {
  const methodMap = { GET: http.get, POST: http.post, PUT: http.put, PATCH: http.patch, DELETE: http.delete }
  const handler = methodMap[method](url, () => HttpResponse.json(data, { status }))
  server.use(handler)
}

/**
 * Adds a request handler that returns an error response.
 * Useful for testing error handling in queries.
 *
 * @example
 * mockErrorResponse(
 *   'GET',
 *   '/api/users/1',
 *   { error: 'Not found' },
 *   404
 * )
 */
export function mockErrorResponse<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string | RegExp,
  data: T,
  status: number = 500
): void {
  const methodMap = { GET: http.get, POST: http.post, PUT: http.put, PATCH: http.patch, DELETE: http.delete }
  const handler = methodMap[method](url, () => HttpResponse.json(data, { status }))
  server.use(handler)
}

/**
 * Adds a request handler that responds after a delay.
 * Useful for testing loading states and timeout scenarios.
 *
 * @example
 * mockSlowResponse(
 *   'GET',
 *   '/api/users/1',
 *   { id: '1', name: 'John' },
 *   500 // delay in ms
 * )
 */
export function mockSlowResponse<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string | RegExp,
  data: T,
  delayMs: number = 500
): void {
  const methodMap = { GET: http.get, POST: http.post, PUT: http.put, PATCH: http.patch, DELETE: http.delete }
  const handler = methodMap[method](url, async () => {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    return HttpResponse.json(data)
  })
  server.use(handler)
}

/**
 * Adds a custom request handler to the MSW server.
 * Use this for complex mocking scenarios not covered by the above helpers.
 *
 * @example
 * import { http } from 'msw'
 * mockCustomResponse(
 *   http.post('/api/users', ({ request }) => {
 *     // Custom logic
 *   })
 * )
 */
export function mockCustomResponse(handler: ReturnType<typeof http.get>): void {
  server.use(handler)
}
