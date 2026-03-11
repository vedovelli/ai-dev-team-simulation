import { useEffect, useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { Task } from '../types/task'
import { serializeSearchParams, deserializeSearchParams } from '../lib/searchParamUtils'

export interface AdvancedSearchFilters {
  search?: string
  status?: string
  agent?: string
}

export interface UseAdvancedSearchOptions {
  debounceMs?: number
  keepPreviousData?: boolean
  enabled?: boolean
}

export interface UseAdvancedSearchResult {
  data: Task[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  filters: AdvancedSearchFilters
  setSearchText: (text: string) => void
  setFilters: (filters: Partial<AdvancedSearchFilters>) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

/**
 * Custom hook for advanced search with debouncing and router integration
 *
 * Features:
 * - Debounced search input (300ms default)
 * - Multi-field filter support (search text, status, agent)
 * - URL search params persistence (router as source of truth)
 * - TanStack Query integration with keepPreviousData for smooth UX
 * - Smart cache busting on filter changes
 *
 * @param options - Configuration options
 * @returns Search result object with data, loading state, and filter controls
 *
 * @example
 * ```tsx
 * const { data: tasks, isLoading, filters, setSearchText } = useAdvancedSearch()
 *
 * return (
 *   <div>
 *     <input
 *       onChange={(e) => setSearchText(e.target.value)}
 *       value={filters.search || ''}
 *     />
 *     {isLoading && <div>Loading...</div>}
 *     {data.map(task => <TaskRow key={task.id} task={task} />)}
 *   </div>
 * )
 * ```
 */
export function useAdvancedSearch({
  debounceMs = 300,
  keepPreviousData = true,
  enabled = true,
}: UseAdvancedSearchOptions = {}): UseAdvancedSearchResult {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '__root__' }) as Record<string, unknown>
  const [localSearch, setLocalSearch] = useState<string>('')
  const [debouncedFilters, setDebouncedFilters] = useState<AdvancedSearchFilters>({})

  // Parse URL params into filters
  const currentFilters = useMemo(() => {
    return deserializeSearchParams(searchParams)
  }, [searchParams])

  // Sync local search input with URL params
  useEffect(() => {
    setLocalSearch(currentFilters.search || '')
  }, [currentFilters.search])

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(currentFilters)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [currentFilters, debounceMs])

  // Build query key based on active filters
  const queryKey = useMemo(
    () => ['search', 'tasks', debouncedFilters],
    [debouncedFilters]
  )

  // Fetch search results
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL('/api/search', window.location.origin)
      const params = serializeSearchParams(debouncedFilters)

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value))
        }
      })

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch search results')
      }

      const result = await response.json()
      return result.data as Task[]
    },
    enabled,
    staleTime: 30000, // 30s
    gcTime: 300000, // 5min
    placeholderData: keepPreviousData ? (prev) => prev : undefined,
  })

  const handleSetSearchText = useCallback(
    (text: string) => {
      setLocalSearch(text)
      navigate({
        search: serializeSearchParams({
          ...currentFilters,
          search: text || undefined,
        }),
      })
    },
    [navigate, currentFilters]
  )

  const handleSetFilters = useCallback(
    (updates: Partial<AdvancedSearchFilters>) => {
      navigate({
        search: serializeSearchParams({
          ...currentFilters,
          ...updates,
        }),
      })
    },
    [navigate, currentFilters]
  )

  const handleClearFilters = useCallback(() => {
    navigate({
      search: {},
    })
  }, [navigate])

  const hasActiveFilters = useMemo(() => {
    return (
      !!debouncedFilters.search ||
      !!debouncedFilters.status ||
      !!debouncedFilters.agent
    )
  }, [debouncedFilters])

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    filters: currentFilters,
    setSearchText: handleSetSearchText,
    setFilters: handleSetFilters,
    clearFilters: handleClearFilters,
    hasActiveFilters,
  }
}
