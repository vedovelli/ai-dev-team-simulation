import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TaskTable } from '../components/TaskTable'
import { AdvancedTableFilters } from '../components/AdvancedTableFilters'
import { useTableFilters } from '../hooks/useTableFilters'
import type { Task } from '../types/task'

async function fetchTasks(filters: {
  status?: string
  priority?: string
  search?: string
  team?: string
  assignee?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: string
}): Promise<Task[]> {
  const params = new URLSearchParams()

  if (filters.status) params.append('status', filters.status)
  if (filters.priority) params.append('priority', filters.priority)
  if (filters.search) params.append('search', filters.search)
  if (filters.team) params.append('team', filters.team)
  if (filters.assignee) params.append('assignee', filters.assignee)
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

  const response = await fetch(`/api/tasks?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch tasks')

  const data = await response.json()
  const tasks = data.data || []

  // Apply client-side date filtering if needed
  if (filters.dateFrom || filters.dateTo) {
    return tasks.filter((task: Task) => {
      const taskDate = new Date(task.createdAt)
      if (filters.dateFrom && taskDate < new Date(filters.dateFrom)) return false
      if (filters.dateTo && taskDate > new Date(filters.dateTo)) return false
      return true
    })
  }

  return tasks
}

export function TasksRoute() {
  const {
    status,
    priority,
    search,
    team,
    assignee,
    dateRange,
    setDateRange,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    clearAllFilters,
    hasActiveFilters,
  } = useTableFilters()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: [
      'tasks',
      status,
      priority,
      search,
      team,
      assignee,
      dateRange.from,
      dateRange.to,
      sorting[0]?.id,
      sorting[0]?.desc,
    ],
    queryFn: () =>
      fetchTasks({
        status: status || undefined,
        priority: priority || undefined,
        search: search || undefined,
        team: team || undefined,
        assignee: assignee || undefined,
        dateFrom: dateRange.from || undefined,
        dateTo: dateRange.to || undefined,
        sortBy: sorting[0]?.id || undefined,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      }),
  })

  // Extract unique values for dropdown filters
  const uniqueTeams = useMemo(
    () => [...new Set(tasks.map((t) => t.team))].sort(),
    [tasks]
  )
  const uniqueAssignees = useMemo(
    () => [...new Set(tasks.map((t) => t.assignee))].sort(),
    [tasks]
  )

  // Local table state management
  const tableData = useMemo(() => {
    let filtered = [...tasks]

    // Apply client-side filtering based on columnFilters and search
    if (search) {
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter((task) => task.status === status)
    }

    // Apply priority filter
    if (priority) {
      filtered = filtered.filter((task) => task.priority === priority)
    }

    // Apply team filter
    if (team) {
      filtered = filtered.filter((task) => task.team === team)
    }

    // Apply assignee filter
    if (assignee) {
      filtered = filtered.filter((task) => task.assignee === assignee)
    }

    // Apply sorting
    if (sorting.length > 0) {
      const sort = sorting[0]
      filtered.sort((a, b) => {
        const aVal = a[sort.id as keyof Task]
        const bVal = b[sort.id as keyof Task]

        if (aVal == null) return sort.desc ? -1 : 1
        if (bVal == null) return sort.desc ? 1 : -1

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sort.desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.desc ? bVal - aVal : aVal - bVal
        }

        return 0
      })
    }

    return filtered
  }, [tasks, search, status, priority, team, assignee, sorting])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="mt-2 text-gray-600">
            Filter, sort, and manage all tasks. Your filtered views are automatically saved in the URL.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <AdvancedTableFilters
              status={status}
              priority={priority}
              search={search}
              team={team}
              assignee={assignee}
              dateFrom={dateRange.from || ''}
              dateTo={dateRange.to || ''}
              teams={uniqueTeams}
              assignees={uniqueAssignees}
              onStatusChange={(newStatus) =>
                setColumnFilters((prev) => {
                  const filtered = prev.filter((f) => f.id !== 'status')
                  if (newStatus) {
                    return [...filtered, { id: 'status', value: newStatus }]
                  }
                  return filtered
                })
              }
              onPriorityChange={(newPriority) =>
                setColumnFilters((prev) => {
                  const filtered = prev.filter((f) => f.id !== 'priority')
                  if (newPriority) {
                    return [...filtered, { id: 'priority', value: newPriority }]
                  }
                  return filtered
                })
              }
              onSearchChange={(newSearch) =>
                setColumnFilters((prev) => {
                  const filtered = prev.filter((f) => f.id !== 'title')
                  if (newSearch) {
                    return [...filtered, { id: 'title', value: newSearch }]
                  }
                  return filtered
                })
              }
              onTeamChange={(newTeam) =>
                setColumnFilters((prev) => {
                  const filtered = prev.filter((f) => f.id !== 'team')
                  if (newTeam) {
                    return [...filtered, { id: 'team', value: newTeam }]
                  }
                  return filtered
                })
              }
              onAssigneeChange={(newAssignee) =>
                setColumnFilters((prev) => {
                  const filtered = prev.filter((f) => f.id !== 'assignee')
                  if (newAssignee) {
                    return [...filtered, { id: 'assignee', value: newAssignee }]
                  }
                  return filtered
                })
              }
              onDateRangeChange={(from, to) => setDateRange(from || undefined, to || undefined)}
              onClearFilters={clearAllFilters}
            />
          </div>

          {/* Table Section */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {tableData.length} of {tasks.length} tasks
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Reset all filters
                </button>
              )}
            </div>
            <TaskTable data={tableData} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}
