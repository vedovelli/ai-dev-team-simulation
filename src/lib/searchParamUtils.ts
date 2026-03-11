/**
 * Utilities for handling search parameter serialization/deserialization
 *
 * Provides type-safe conversion between URL search params and filter objects,
 * with proper handling of undefined values and array serialization.
 */

import type { AdvancedSearchFilters } from '../hooks/useAdvancedSearch'

/**
 * Serialize filter object to URL-compatible params
 *
 * Removes undefined values and handles array serialization with comma separation.
 *
 * @param filters - Filter object to serialize
 * @returns Serialized params ready for URL
 *
 * @example
 * serializeSearchParams({ search: 'test', status: 'active' })
 * // { search: 'test', status: 'active' }
 */
export function serializeSearchParams(filters: Partial<AdvancedSearchFilters>): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {}

  if (filters.search) {
    params.search = filters.search
  }
  if (filters.status) {
    params.status = filters.status
  }
  if (filters.agent) {
    params.agent = filters.agent
  }

  return params
}

/**
 * Deserialize URL search params to filter object
 *
 * Converts URL params (which are always strings) to typed filter object.
 * Handles undefined/empty values gracefully.
 *
 * @param searchParams - Object from router's useSearch()
 * @returns Typed filter object
 *
 * @example
 * const filters = deserializeSearchParams({ search: 'test', status: 'active' })
 * // { search: 'test', status: 'active' }
 */
export function deserializeSearchParams(searchParams: Record<string, unknown>): AdvancedSearchFilters {
  return {
    search: (searchParams.search as string) || undefined,
    status: (searchParams.status as string) || undefined,
    agent: (searchParams.agent as string) || undefined,
  }
}

/**
 * Build fetch URL with serialized params
 *
 * Convenience function to build complete API URL with properly formatted search params.
 *
 * @param endpoint - API endpoint path
 * @param filters - Filters to serialize
 * @returns Complete URL with search params
 *
 * @example
 * const url = buildSearchUrl('/api/search', { search: 'test' })
 * // 'https://example.com/api/search?search=test'
 */
export function buildSearchUrl(endpoint: string, filters: AdvancedSearchFilters): URL {
  const url = new URL(endpoint, window.location.origin)
  const params = serializeSearchParams(filters)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url
}
