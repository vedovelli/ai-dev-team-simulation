/**
 * Tests for useTableRouter hook
 * Tests query parameter parsing, serialization, and URL state management
 */

import { describe, it, expect } from 'vitest'
import {
  parseTableQuery,
  serializeTableQuery,
  type TableRouterQuery,
} from '../useTableRouter'

describe('parseTableQuery', () => {
  it('should parse search parameter', () => {
    const params = { search: 'login bug' }
    const result = parseTableQuery(params)
    expect(result.search).toBe('login bug')
  })

  it('should handle missing search parameter', () => {
    const result = parseTableQuery({})
    expect(result.search).toBeUndefined()
  })

  it('should parse single filter with bracket notation', () => {
    const params = { 'filter[status]': 'active' }
    const result = parseTableQuery(params)
    expect(result.filter).toEqual({ status: 'active' })
  })

  it('should parse multiple filters', () => {
    const params = {
      'filter[status]': 'active',
      'filter[priority]': 'high',
      'filter[assignee]': 'alice',
    }
    const result = parseTableQuery(params)
    expect(result.filter).toEqual({
      status: 'active',
      priority: 'high',
      assignee: 'alice',
    })
  })

  it('should ignore non-filter bracket notation params', () => {
    const params = {
      'filter[status]': 'active',
      'other[key]': 'value',
    }
    const result = parseTableQuery(params)
    expect(result.filter).toEqual({ status: 'active' })
  })

  it('should parse sort field', () => {
    const params = { sort: 'createdAt' }
    const result = parseTableQuery(params)
    expect(result.sort).toBe('createdAt')
  })

  it('should parse descending sort with prefix', () => {
    const params = { sort: '-createdAt' }
    const result = parseTableQuery(params)
    expect(result.sort).toBe('-createdAt')
  })

  it('should parse pagination parameters', () => {
    const params = { page: '2', limit: '25' }
    const result = parseTableQuery(params)
    expect(result.page).toBe(2)
    expect(result.limit).toBe(25)
  })

  it('should parse numeric pagination parameters', () => {
    const params = { page: 3, limit: 50 }
    const result = parseTableQuery(params)
    expect(result.page).toBe(3)
    expect(result.limit).toBe(50)
  })

  it('should ignore invalid page/limit values', () => {
    const params = { page: '0', limit: '-5' }
    const result = parseTableQuery(params)
    expect(result.page).toBeUndefined()
    expect(result.limit).toBeUndefined()
  })

  it('should parse complete query with all parameters', () => {
    const params = {
      search: 'authentication',
      'filter[status]': 'in-progress',
      'filter[priority]': 'high',
      sort: '-createdAt',
      page: '2',
      limit: '20',
    }
    const result = parseTableQuery(params)
    expect(result).toEqual({
      search: 'authentication',
      filter: { status: 'in-progress', priority: 'high' },
      sort: '-createdAt',
      page: 2,
      limit: 20,
    })
  })
})

describe('serializeTableQuery', () => {
  it('should serialize search parameter', () => {
    const query: TableRouterQuery = { search: 'login bug' }
    const result = serializeTableQuery(query)
    expect(result).toEqual({ search: 'login bug' })
  })

  it('should not include empty search', () => {
    const query: TableRouterQuery = { search: '' }
    const result = serializeTableQuery(query)
    expect(result.search).toBeUndefined()
  })

  it('should serialize single filter', () => {
    const query: TableRouterQuery = { filter: { status: 'active' } }
    const result = serializeTableQuery(query)
    expect(result).toEqual({ 'filter[status]': 'active' })
  })

  it('should serialize multiple filters', () => {
    const query: TableRouterQuery = {
      filter: { status: 'active', priority: 'high', assignee: 'alice' },
    }
    const result = serializeTableQuery(query)
    expect(result).toEqual({
      'filter[status]': 'active',
      'filter[priority]': 'high',
      'filter[assignee]': 'alice',
    })
  })

  it('should not include empty filters object', () => {
    const query: TableRouterQuery = { filter: {} }
    const result = serializeTableQuery(query)
    expect(result.filter).toBeUndefined()
    expect(Object.keys(result).length).toBe(0)
  })

  it('should serialize sort field', () => {
    const query: TableRouterQuery = { sort: 'createdAt' }
    const result = serializeTableQuery(query)
    expect(result).toEqual({ sort: 'createdAt' })
  })

  it('should preserve descending sort prefix', () => {
    const query: TableRouterQuery = { sort: '-createdAt' }
    const result = serializeTableQuery(query)
    expect(result).toEqual({ sort: '-createdAt' })
  })

  it('should not include page 1 (default)', () => {
    const query: TableRouterQuery = { page: 1 }
    const result = serializeTableQuery(query)
    expect(result.page).toBeUndefined()
  })

  it('should include page > 1', () => {
    const query: TableRouterQuery = { page: 2 }
    const result = serializeTableQuery(query)
    expect(result).toEqual({ page: 2 })
  })

  it('should not include default limit', () => {
    const query: TableRouterQuery = { limit: 10 }
    const result = serializeTableQuery(query)
    expect(result.limit).toBeUndefined()
  })

  it('should include non-default limit', () => {
    const query: TableRouterQuery = { limit: 25 }
    const result = serializeTableQuery(query)
    expect(result).toEqual({ limit: 25 })
  })

  it('should serialize complete query', () => {
    const query: TableRouterQuery = {
      search: 'authentication',
      filter: { status: 'in-progress', priority: 'high' },
      sort: '-createdAt',
      page: 2,
      limit: 20,
    }
    const result = serializeTableQuery(query)
    expect(result).toEqual({
      search: 'authentication',
      'filter[status]': 'in-progress',
      'filter[priority]': 'high',
      sort: '-createdAt',
      page: 2,
      limit: 20,
    })
  })
})

describe('Round-trip serialization', () => {
  it('should parse and serialize back to original', () => {
    const original = {
      search: 'test',
      'filter[status]': 'active',
      'filter[priority]': 'high',
      sort: '-createdAt',
      page: '2',
      limit: '20',
    }

    const parsed = parseTableQuery(original)
    const serialized = serializeTableQuery(parsed)

    expect(serialized).toEqual({
      search: 'test',
      'filter[status]': 'active',
      'filter[priority]': 'high',
      sort: '-createdAt',
      page: 2,
      limit: 20,
    })
  })

  it('should handle empty query round-trip', () => {
    const parsed = parseTableQuery({})
    const serialized = serializeTableQuery(parsed)
    expect(Object.keys(serialized).length).toBe(0)
  })
})
