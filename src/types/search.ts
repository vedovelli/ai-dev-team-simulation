/**
 * Types for advanced search functionality
 *
 * Defines filter types, search state, and API response schemas.
 */

import type { Task } from './task'

/**
 * Advanced search filter options
 *
 * Supports multi-field filtering across task properties.
 * All fields are optional and combined with AND logic.
 */
export interface AdvancedSearchFilters {
  search?: string  // Text search (searches task title and ID)
  status?: string  // Task status filter (backlog, in-progress, in-review, done)
  agent?: string   // Agent/Assignee filter (person name)
}

/**
 * Search API response format
 *
 * Contains paginated search results and metadata.
 */
export interface SearchResponse {
  data: Task[]
  meta: SearchMetadata
}

/**
 * Metadata about search results
 */
export interface SearchMetadata {
  total: number        // Total number of matching results
  page: number         // Current page number (1-indexed)
  limit: number        // Results per page
  totalPages: number   // Total number of pages
}

/**
 * Search request parameters (as passed to API)
 */
export interface SearchRequest {
  search?: string
  status?: string
  agent?: string
  page?: number
  limit?: number
}
