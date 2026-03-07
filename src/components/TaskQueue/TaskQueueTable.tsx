import React, { useState, useMemo } from 'react'
import { useTaskQueueTable } from '../../hooks/useTaskQueueTable'
import type { Task, TaskStatus } from '../../types/task'
import type { Agent } from '../../types/agent'
import { AssignmentCell } from './AssignmentCell'
import { BulkAssignmentForm } from './BulkAssignmentForm'
import { WorkloadIndicator } from './WorkloadIndicator'

export interface TaskQueueTableProps {
  tasks: Task[]
  agents: Agent[]
  isLoading?: boolean
  onAssignTask?: (taskId: string, agentId: string) => Promise<void>
  onBulkAssign?: (taskIds: string[], agentId: string) => Promise<void>
}

/**
 * Advanced task queue table with multi-select, inline assignment, and bulk operations.
 * Demonstrates table patterns with form integration and mutation handling.
 */
export function TaskQueueTable({
  tasks,
  agents,
  isLoading = false,
  onAssignTask,
  onBulkAssign,
}: TaskQueueTableProps) {
  const {
    sortedAndFilteredData,
    selectedTaskIds,
    sortKey,
    sortOrder,
    filters,
    handleSort,
    handleFilterChange,
    toggleSelectTask,
    selectAllTasks,
    clearSelection,
    isTaskSelected,
    selectedCount,
  } = useTaskQueueTable({ data: tasks })

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [assignmentLoading, setAssignmentLoading] = useState(false)

  // Get unique statuses and sprints for filters
  const uniqueStatuses = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.status))),
    [tasks]
  )
  const uniqueSprints = useMemo(() => Array.from(new Set(tasks.map((t) => t.sprint))), [tasks])
  const uniqueAssignees = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean))),
    [tasks]
  )

  const handleAssign = async (taskId: string, agentId: string) => {
    if (!onAssignTask) return

    setAssignmentLoading(true)
    try {
      await onAssignTask(taskId, agentId)
    } finally {
      setAssignmentLoading(false)
    }
  }

  const handleBulkSubmit = async (agentId: string) => {
    if (!onBulkAssign || selectedCount === 0) return

    setAssignmentLoading(true)
    try {
      const selectedIds = Array.from(selectedTaskIds)
      await onBulkAssign(selectedIds, agentId)
      clearSelection()
      setShowBulkForm(false)
    } finally {
      setAssignmentLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedCount === sortedAndFilteredData.length) {
      clearSelection()
    } else {
      selectAllTasks(sortedAndFilteredData.map((t) => t.id))
    }
  }

  const getSortIndicator = (column: keyof Task) => {
    if (sortKey !== column) return ' ⇅'
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400'
      case 'medium':
        return 'text-yellow-400'
      case 'low':
        return 'text-green-400'
      default:
        return 'text-slate-400'
    }
  }

  const getStatusBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return 'bg-green-900/30 text-green-400'
      case 'in-progress':
        return 'bg-blue-900/30 text-blue-400'
      case 'in-review':
        return 'bg-purple-900/30 text-purple-400'
      case 'backlog':
        return 'bg-slate-700 text-slate-300'
      default:
        return 'bg-slate-700 text-slate-300'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="bg-slate-800 rounded-lg p-4 space-y-3 border border-slate-700">
        <h3 className="font-semibold text-slate-200">Filters</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) =>
                handleFilterChange({
                  ...filters,
                  status: (e.target.value || undefined) as TaskStatus | undefined,
                })
              }
              className="w-full px-2 py-1 bg-slate-700 text-slate-200 text-sm rounded border border-slate-600"
            >
              <option value="">All Status</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Assignee</label>
            <select
              value={filters.assignee || ''}
              onChange={(e) =>
                handleFilterChange({
                  ...filters,
                  assignee: e.target.value || undefined,
                })
              }
              className="w-full px-2 py-1 bg-slate-700 text-slate-200 text-sm rounded border border-slate-600"
            >
              <option value="">All Assignees</option>
              <option value="">Unassigned</option>
              {uniqueAssignees.map((assigneeId) => {
                const agent = agents.find((a) => a.id === assigneeId)
                return (
                  <option key={assigneeId} value={assigneeId}>
                    {agent?.name || assigneeId}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Sprint</label>
            <select
              value={filters.sprint || ''}
              onChange={(e) =>
                handleFilterChange({
                  ...filters,
                  sprint: e.target.value || undefined,
                })
              }
              className="w-full px-2 py-1 bg-slate-700 text-slate-200 text-sm rounded border border-slate-600"
            >
              <option value="">All Sprints</option>
              {uniqueSprints.map((sprint) => (
                <option key={sprint} value={sprint}>
                  {sprint}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selection Info and Bulk Actions */}
      {selectedCount > 0 && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-300">
              {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setShowBulkForm(!showBulkForm)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Bulk Assign
            </button>
          </div>
        </div>
      )}

      {/* Bulk Assignment Form */}
      {showBulkForm && (
        <BulkAssignmentForm
          selectedCount={selectedCount}
          agents={agents}
          onSubmit={handleBulkSubmit}
          onCancel={() => setShowBulkForm(false)}
          isLoading={assignmentLoading}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <div className="rounded-lg bg-slate-800 p-8 text-center text-slate-400">
          Loading tasks...
        </div>
      ) : (
        <div className="rounded-lg bg-slate-800 shadow-lg overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedCount > 0 && selectedCount === sortedAndFilteredData.length
                      }
                      onChange={handleSelectAll}
                      className="rounded"
                      disabled={sortedAndFilteredData.length === 0}
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-slate-200 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort('title')}
                  >
                    Task{getSortIndicator('title')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-slate-200 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort('priority')}
                  >
                    Priority{getSortIndicator('priority')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-slate-200 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort('status')}
                  >
                    Status{getSortIndicator('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                    Assigned To
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-slate-200 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort('sprint')}
                  >
                    Sprint{getSortIndicator('sprint')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredData.map((task) => (
                    <tr
                      key={task.id}
                      className={`border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${
                        isTaskSelected(task.id) ? 'bg-slate-700/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isTaskSelected(task.id)}
                          onChange={() => toggleSelectTask(task.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-300">{task.title}</td>
                      <td className={`px-6 py-3 text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <AssignmentCell
                          task={task}
                          agents={agents}
                          isEditing={editingTaskId === task.id}
                          onAssignmentChange={handleAssign}
                          onEditToggle={(taskId, isEditing) =>
                            setEditingTaskId(isEditing ? taskId : null)
                          }
                          isLoading={assignmentLoading}
                        />
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-400">{task.sprint}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Workload Summary */}
      {agents.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
          <h3 className="font-semibold text-slate-200">Agent Workload</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const agentTasks = tasks.filter(
                (t) => t.assignee === agent.id && t.status !== 'done'
              )
              return (
                <WorkloadIndicator
                  key={agent.id}
                  agentName={agent.name}
                  currentTasks={agentTasks.length}
                  maxTasks={10}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
