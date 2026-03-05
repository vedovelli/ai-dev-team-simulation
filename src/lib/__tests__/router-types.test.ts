import { describe, it, expect } from 'vitest'
import {
  AgentIdParamSchema,
  SprintIdParamSchema,
  TeamIdParamSchema,
  TasksSearchParamSchema,
  AgentsSearchParamSchema,
  SprintsSearchParamSchema,
  AnalyticsSearchParamSchema,
  serializeTasksSearchParams,
  deserializeTasksSearchParams,
  serializeAgentsSearchParams,
  deserializeAgentsSearchParams,
  serializeSprintsSearchParams,
  deserializeSprintsSearchParams,
  serializeAnalyticsSearchParams,
  deserializeAnalyticsSearchParams,
} from '../router-types'

describe('Route Parameter Validation', () => {
  describe('AgentIdParamSchema', () => {
    it('should validate valid agent IDs', () => {
      const result = AgentIdParamSchema.parse({ id: 'agent-1' })
      expect(result.id).toBe('agent-1')
    })

    it('should reject empty agent IDs', () => {
      expect(() => AgentIdParamSchema.parse({ id: '' })).toThrow()
    })
  })

  describe('SprintIdParamSchema', () => {
    it('should validate valid sprint IDs', () => {
      const result = SprintIdParamSchema.parse({ id: 'sprint-1' })
      expect(result.id).toBe('sprint-1')
    })

    it('should reject missing sprint IDs', () => {
      expect(() => SprintIdParamSchema.parse({})).toThrow()
    })
  })

  describe('TeamIdParamSchema', () => {
    it('should validate valid team IDs', () => {
      const result = TeamIdParamSchema.parse({ id: 'team-1' })
      expect(result.id).toBe('team-1')
    })
  })
})

describe('Search Parameter Validation', () => {
  describe('TasksSearchParamSchema', () => {
    it('should allow empty search params', () => {
      const result = TasksSearchParamSchema.parse({})
      expect(result).toEqual({})
    })

    it('should validate status filter', () => {
      const result = TasksSearchParamSchema.parse({ status: 'todo' })
      expect(result.status).toBe('todo')
    })

    it('should validate priority filter', () => {
      const result = TasksSearchParamSchema.parse({ priority: 'high' })
      expect(result.priority).toBe('high')
    })

    it('should validate search string', () => {
      const result = TasksSearchParamSchema.parse({ search: 'test' })
      expect(result.search).toBe('test')
    })

    it('should validate sort order', () => {
      const result = TasksSearchParamSchema.parse({ sortOrder: 'asc' })
      expect(result.sortOrder).toBe('asc')
    })

    it('should coerce string page number to integer', () => {
      const result = TasksSearchParamSchema.parse({ page: '2' })
      expect(result.page).toBe(2)
      expect(typeof result.page).toBe('number')
    })

    it('should reject negative page numbers', () => {
      expect(() => TasksSearchParamSchema.parse({ page: -1 })).toThrow()
    })
  })

  describe('AgentsSearchParamSchema', () => {
    it('should allow empty search params', () => {
      const result = AgentsSearchParamSchema.parse({})
      expect(result).toEqual({})
    })

    it('should validate filter string', () => {
      const result = AgentsSearchParamSchema.parse({ filter: 'frontend' })
      expect(result.filter).toBe('frontend')
    })

    it('should validate sort field', () => {
      const result = AgentsSearchParamSchema.parse({ sort: 'name' })
      expect(result.sort).toBe('name')
    })

    it('should reject invalid sort field', () => {
      expect(() => AgentsSearchParamSchema.parse({ sort: 'invalid' })).toThrow()
    })

    it('should validate sort order', () => {
      const result = AgentsSearchParamSchema.parse({ sortOrder: 'desc' })
      expect(result.sortOrder).toBe('desc')
    })
  })
})

describe('Search Parameter Serialization', () => {
  describe('serializeTasksSearchParams', () => {
    it('should serialize all parameters', () => {
      const params = {
        status: 'todo',
        priority: 'high',
        search: 'test',
        team: 'Frontend',
        assignee: 'Alice',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        sortBy: 'title',
        sortOrder: 'asc' as const,
        page: 1,
        limit: 10,
      }

      const serialized = serializeTasksSearchParams(params)

      expect(serialized).toEqual({
        status: 'todo',
        priority: 'high',
        search: 'test',
        team: 'Frontend',
        assignee: 'Alice',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        sortBy: 'title',
        sortOrder: 'asc',
        page: '1',
        limit: '10',
      })
    })

    it('should omit undefined parameters', () => {
      const params = {
        status: 'todo',
        priority: undefined,
        search: undefined,
      }

      const serialized = serializeTasksSearchParams(params)

      expect(serialized).toEqual({
        status: 'todo',
      })
    })

    it('should handle empty parameters', () => {
      const serialized = serializeTasksSearchParams({})
      expect(serialized).toEqual({})
    })
  })

  describe('deserializeTasksSearchParams', () => {
    it('should deserialize valid parameters', () => {
      const params = {
        status: 'todo',
        priority: 'high',
        page: '1',
      }

      const deserialized = deserializeTasksSearchParams(params)

      expect(deserialized).toEqual({
        status: 'todo',
        priority: 'high',
        page: 1,
      })
    })

    it('should handle empty parameters', () => {
      const deserialized = deserializeTasksSearchParams({})
      expect(deserialized).toEqual({})
    })
  })

  describe('serializeAgentsSearchParams', () => {
    it('should serialize agent parameters', () => {
      const params = {
        filter: 'frontend',
        sort: 'name' as const,
        sortOrder: 'asc' as const,
      }

      const serialized = serializeAgentsSearchParams(params)

      expect(serialized).toEqual({
        filter: 'frontend',
        sort: 'name',
        sortOrder: 'asc',
      })
    })

    it('should omit undefined parameters', () => {
      const params = {
        filter: 'frontend',
        sort: undefined,
      }

      const serialized = serializeAgentsSearchParams(params)

      expect(serialized).toEqual({
        filter: 'frontend',
      })
    })
  })

  describe('deserializeAgentsSearchParams', () => {
    it('should deserialize valid agent parameters', () => {
      const params = {
        filter: 'frontend',
        sort: 'name',
        sortOrder: 'desc',
      }

      const deserialized = deserializeAgentsSearchParams(params)

      expect(deserialized).toEqual({
        filter: 'frontend',
        sort: 'name',
        sortOrder: 'desc',
      })
    })
  })
})

describe('Sprints Search Parameters', () => {
  describe('serializeSprintsSearchParams', () => {
    it('should serialize sprints parameters', () => {
      const params = {
        status: 'active',
        priority: 'high',
        search: 'sprint test',
        team: 'Frontend',
        sprint: 'Sprint 1',
        assignee: 'Alice',
      }

      const serialized = serializeSprintsSearchParams(params)

      expect(serialized).toEqual({
        status: 'active',
        priority: 'high',
        search: 'sprint test',
        team: 'Frontend',
        sprint: 'Sprint 1',
        assignee: 'Alice',
      })
    })

    it('should omit undefined parameters', () => {
      const params = {
        status: 'active',
        priority: undefined,
      }

      const serialized = serializeSprintsSearchParams(params)

      expect(serialized).toEqual({
        status: 'active',
      })
    })
  })

  describe('deserializeSprintsSearchParams', () => {
    it('should deserialize valid sprints parameters', () => {
      const params = {
        status: 'active',
        priority: 'high',
        sprint: 'Sprint 1',
      }

      const deserialized = deserializeSprintsSearchParams(params)

      expect(deserialized).toEqual({
        status: 'active',
        priority: 'high',
        sprint: 'Sprint 1',
      })
    })
  })
})

describe('Analytics Search Parameters', () => {
  describe('serializeAnalyticsSearchParams', () => {
    it('should serialize analytics parameters with default timeRange', () => {
      const params = {
        sprint: 'Sprint 1',
        status: 'completed',
        timeRange: '30d' as const,
      }

      const serialized = serializeAnalyticsSearchParams(params)

      expect(serialized).toEqual({
        sprint: 'Sprint 1',
        status: 'completed',
        timeRange: '30d',
      })
    })
  })

  describe('deserializeAnalyticsSearchParams', () => {
    it('should deserialize and apply default timeRange', () => {
      const params = {
        sprint: 'Sprint 1',
      }

      const deserialized = deserializeAnalyticsSearchParams(params)

      expect(deserialized.timeRange).toBe('30d')
      expect(deserialized.sprint).toBe('Sprint 1')
    })
  })
})

describe('Round-trip Serialization', () => {
  it('should serialize and deserialize tasks search params correctly', () => {
    const original = {
      status: 'todo',
      priority: 'high',
      search: 'test task',
      page: 2,
      limit: 20,
    }

    const serialized = serializeTasksSearchParams(original)
    const deserialized = deserializeTasksSearchParams(serialized)

    expect(deserialized).toEqual(original)
  })

  it('should serialize and deserialize agents search params correctly', () => {
    const original = {
      filter: 'backend',
      sort: 'role' as const,
      sortOrder: 'desc' as const,
    }

    const serialized = serializeAgentsSearchParams(original)
    const deserialized = deserializeAgentsSearchParams(serialized)

    expect(deserialized).toEqual(original)
  })

  it('should serialize and deserialize sprints search params correctly', () => {
    const original = {
      status: 'active',
      priority: 'high',
      team: 'Frontend',
    }

    const serialized = serializeSprintsSearchParams(original)
    const deserialized = deserializeSprintsSearchParams(serialized)

    expect(deserialized).toEqual(original)
  })

  it('should serialize and deserialize analytics search params correctly', () => {
    const original = {
      sprint: 'Sprint 1',
      status: 'completed',
      timeRange: '7d' as const,
    }

    const serialized = serializeAnalyticsSearchParams(original)
    const deserialized = deserializeAnalyticsSearchParams(serialized)

    expect(deserialized).toEqual(original)
  })
})
