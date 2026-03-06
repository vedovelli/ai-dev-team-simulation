/**
 * Filter system types for composable, reusable data table filtering
 */

export type FilterFieldType = 'text' | 'multiselect' | 'select' | 'daterange' | 'checkbox'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterFieldDefinition {
  name: string
  label: string
  type: FilterFieldType
  options?: FilterOption[]
  defaultValue?: string | string[] | { from?: string; to?: string }
}

export interface FilterPreset {
  name: string
  label: string
  filters: Record<string, string | string[] | { from?: string; to?: string }>
}

export interface FilterState {
  [key: string]: string | string[] | { from?: string; to?: string } | undefined
}

export interface UseTableFiltersOptions {
  fields: FilterFieldDefinition[]
  presets?: FilterPreset[]
  onFiltersChange?: (filters: FilterState) => void
}

export interface UseTableFiltersReturn {
  filters: FilterState
  updateFilter: (fieldName: string, value: any) => void
  updateFilters: (updates: Partial<FilterState>) => void
  clearFilters: () => void
  clearFilter: (fieldName: string) => void
  applyPreset: (presetName: string) => void
  hasActiveFilters: boolean
  activeFilterCount: number
}
