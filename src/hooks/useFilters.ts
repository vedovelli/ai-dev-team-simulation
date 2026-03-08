import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

/**
 * Represents a single filter condition
 */
export interface FilterPredicate<T = unknown> {
  field: string
  operator: 'equals' | 'contains' | 'in' | 'gt' | 'lt' | 'range'
  value: T
}

/**
 * Filter state interface
 */
export interface FilterState {
  [key: string]: string | string[] | number | boolean | undefined | null
}

/**
 * Advanced filtering hook with debounced search support
 * Provides composable filtering with URL persistence via TanStack Router
 *
 * @template T - The type of search query parameters
 *
 * @example
 * ```tsx
 * const {
 *   filters,
 *   search,
 *   setSearch,
 *   setFilter,
 *   setFilters,
 *   clearFilter,
 *   clearFilters,
 *   hasActiveFilters,
 * } = useFilters<AgentFilters>({
 *   debounceMs: 300,
 * })
 *
 * // Update search with debouncing
 * setSearch('alice') // Debounced to 300ms
 *
 * // Update single filter
 * setFilter('status', 'active')
 *
 * // Update multiple filters at once
 * setFilters({ status: 'active', sortBy: 'name' })
 *
 * // Clear specific filters
 * clearFilter('search')
 *
 * // Clear all filters
 * clearFilters()
 * ```
 */
export interface UseFiltersOptions {
  /** Debounce delay for search input in milliseconds (default: 300) */
  debounceMs?: number
  /** Route path for useSearch (default: __root__) */
  from?: string
  /** Whether to replace history instead of push (default: false) */
  replace?: boolean
}

export interface UseFiltersReturn<T extends FilterState = FilterState> {
  /** Current filter state from URL */
  filters: T
  /** Current search value (debounced) */
  search: string
  /** Raw search input (unfltered) */
  rawSearch: string
  /** Set search with debouncing */
  setSearch: (value: string) => void
  /** Set single filter */
  setFilter: <K extends keyof T>(key: K, value: T[K] | null) => void
  /** Set multiple filters at once */
  setFilters: (updates: Partial<T>) => void
  /** Clear single filter */
  clearFilter: <K extends keyof T>(key: K) => void
  /** Clear all filters */
  clearFilters: () => void
  /** Check if any filters are active */
  hasActiveFilters: boolean
}

export function useFilters<T extends FilterState = FilterState>(
  options: UseFiltersOptions = {}
): UseFiltersReturn<T> {
  const { debounceMs = 300, from = '__root__', replace = false } = options

  const navigate = useNavigate({ from })
  const searchParams = useSearch({ from }) as T

  // Track raw search input separately for immediate UI feedback
  const [rawSearch, setRawSearch] = useState('')
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Extract search value from URL
  const urlSearch = typeof searchParams.search === 'string' ? searchParams.search : ''

  // Sync raw search with URL on mount and changes
  useEffect(() => {
    setRawSearch(urlSearch)
  }, [urlSearch])

  /**
   * Set search with debouncing
   * Updates rawSearch immediately for responsive UI
   * Debounces URL update for performance
   */
  const setSearch = useCallback(
    (value: string) => {
      setRawSearch(value)

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Set new debounced timeout
      debounceTimeoutRef.current = setTimeout(() => {
        const newParams = { ...searchParams }
        if (value && value.trim()) {
          newParams.search = value as any
        } else {
          delete newParams.search
        }
        navigate({
          search: newParams,
          replace,
        })
      }, debounceMs)
    },
    [debounceMs, navigate, replace, searchParams]
  )

  /**
   * Set a single filter value
   */
  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K] | null) => {
      const newParams = { ...searchParams }

      if (value === null || value === undefined) {
        delete newParams[key]
      } else if (Array.isArray(value) && value.length === 0) {
        delete newParams[key]
      } else if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      ) {
        delete newParams[key]
      } else {
        newParams[key] = value
      }

      navigate({
        search: newParams,
        replace,
      })
    },
    [navigate, searchParams, replace]
  )

  /**
   * Set multiple filters at once
   */
  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const newParams = { ...searchParams }

      Object.entries(updates).forEach(([key, value]) => {
        const k = key as keyof T
        if (value === null || value === undefined) {
          delete newParams[k]
        } else if (Array.isArray(value) && value.length === 0) {
          delete newParams[k]
        } else if (
          typeof value === 'object' &&
          !Array.isArray(value) &&
          Object.keys(value).length === 0
        ) {
          delete newParams[k]
        } else {
          newParams[k] = value as any
        }
      })

      navigate({
        search: newParams,
        replace,
      })
    },
    [navigate, searchParams, replace]
  )

  /**
   * Clear a single filter
   */
  const clearFilter = useCallback(
    <K extends keyof T>(key: K) => {
      const newParams = { ...searchParams }
      delete newParams[key]

      navigate({
        search: newParams,
        replace,
      })
    },
    [navigate, searchParams, replace]
  )

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    navigate({
      search: {} as T,
      replace,
    })
  }, [navigate, replace])

  /**
   * Check if any filters are active (excluding search)
   */
  const hasActiveFilters = useMemo(() => {
    return Object.entries(searchParams).some(([key, value]) => {
      // Skip search for this check if you want
      if (key === 'search') return !!value
      return value !== null && value !== undefined
    })
  }, [searchParams])

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    filters: searchParams,
    search: urlSearch,
    rawSearch,
    setSearch,
    setFilter,
    setFilters,
    clearFilter,
    clearFilters,
    hasActiveFilters,
  }
}
