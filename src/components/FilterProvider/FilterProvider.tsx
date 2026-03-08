import React, { createContext, useContext, useCallback, useMemo } from 'react'

/**
 * Represents a single filter condition
 */
export interface FilterPredicate<T = unknown> {
  field: string
  operator: 'equals' | 'contains' | 'in' | 'gt' | 'lt' | 'range'
  value: T
}

/**
 * Filter rule with optional label and description
 */
export interface FilterRule<T = unknown> extends FilterPredicate<T> {
  label?: string
  description?: string
}

/**
 * Context for filter configuration and predicates
 */
interface FilterContextType<TData = unknown, TFilter extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Apply filters to data using predicates
   */
  applyFilters: (data: TData[], predicates: FilterPredicate[]) => TData[]

  /**
   * Create a filter predicate
   */
  createPredicate: <T = unknown>(
    field: string,
    operator: FilterPredicate<T>['operator'],
    value: T
  ) => FilterPredicate<T>

  /**
   * Combine multiple predicates with AND logic
   */
  combinePredicates: (predicates: FilterPredicate[], logic: 'AND' | 'OR') => (item: TData) => boolean

  /**
   * Get predicates from filter state
   */
  getPredicatesFromFilters: (filters: TFilter) => FilterPredicate[]
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

/**
 * Provider component for advanced filtering
 * Provides composable filter predicates and utilities
 *
 * @example
 * ```tsx
 * <FilterProvider>
 *   <AgentsList />
 * </FilterProvider>
 * ```
 */
export function FilterProvider({ children }: { children: React.ReactNode }) {
  /**
   * Check if a single item matches a predicate
   */
  const matchesPredicate = useCallback(
    (item: unknown, predicate: FilterPredicate): boolean => {
      const fieldValue = (item as Record<string, unknown>)[predicate.field]

      switch (predicate.operator) {
        case 'equals':
          return fieldValue === predicate.value

        case 'contains':
          if (typeof fieldValue !== 'string' || typeof predicate.value !== 'string') {
            return false
          }
          return fieldValue.toLowerCase().includes(predicate.value.toLowerCase())

        case 'in':
          if (!Array.isArray(predicate.value)) {
            return fieldValue === predicate.value
          }
          return (predicate.value as unknown[]).includes(fieldValue)

        case 'gt':
          if (typeof fieldValue !== 'number' || typeof predicate.value !== 'number') {
            return false
          }
          return fieldValue > predicate.value

        case 'lt':
          if (typeof fieldValue !== 'number' || typeof predicate.value !== 'number') {
            return false
          }
          return fieldValue < predicate.value

        case 'range': {
          if (typeof predicate.value !== 'object' || !predicate.value) {
            return false
          }
          const { min, max } = predicate.value as { min?: number; max?: number }
          const num = Number(fieldValue)
          if (Number.isNaN(num)) return false
          if (min !== undefined && num < min) return false
          if (max !== undefined && num > max) return false
          return true
        }

        default:
          return false
      }
    },
    []
  )

  /**
   * Apply array of filters to data
   */
  const applyFilters = useCallback(
    (data: unknown[], predicates: FilterPredicate[]): unknown[] => {
      if (predicates.length === 0) {
        return data
      }

      return data.filter((item) => predicates.every((predicate) => matchesPredicate(item, predicate)))
    },
    [matchesPredicate]
  )

  /**
   * Create a filter predicate
   */
  const createPredicate = useCallback(
    <T,>(field: string, operator: FilterPredicate<T>['operator'], value: T): FilterPredicate<T> => ({
      field,
      operator,
      value,
    }),
    []
  )

  /**
   * Combine predicates with AND/OR logic
   */
  const combinePredicates = useCallback(
    (predicates: FilterPredicate[], logic: 'AND' | 'OR') => {
      return (item: unknown) => {
        if (logic === 'AND') {
          return predicates.every((predicate) => matchesPredicate(item, predicate))
        } else {
          return predicates.length === 0 || predicates.some((predicate) => matchesPredicate(item, predicate))
        }
      }
    },
    [matchesPredicate]
  )

  /**
   * Convert filter state to predicates
   * Override this in subclasses for custom filter mappings
   */
  const getPredicatesFromFilters = useCallback((filters: Record<string, unknown>): FilterPredicate[] => {
    const predicates: FilterPredicate[] = []

    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return
      }

      if (typeof value === 'string' && value.length > 0) {
        // Default: treat strings as "contains"
        predicates.push(createPredicate(key, 'contains', value))
      } else if (Array.isArray(value) && value.length > 0) {
        // Arrays use "in" operator
        predicates.push(createPredicate(key, 'in', value))
      } else if (typeof value === 'number') {
        // Numbers use "equals"
        predicates.push(createPredicate(key, 'equals', value))
      } else if (typeof value === 'boolean') {
        // Booleans use "equals"
        predicates.push(createPredicate(key, 'equals', value))
      }
    })

    return predicates
  }, [createPredicate])

  const value: FilterContextType = useMemo(
    () => ({
      applyFilters,
      createPredicate,
      combinePredicates,
      getPredicatesFromFilters,
    }),
    [applyFilters, createPredicate, combinePredicates, getPredicatesFromFilters]
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

/**
 * Hook to use filter context
 */
export function useFilterContext() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilterContext must be used within FilterProvider')
  }
  return context
}
