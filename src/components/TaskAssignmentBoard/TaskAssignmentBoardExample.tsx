import { TaskAssignmentBoard } from './TaskAssignmentBoard'

/**
 * Example of using the TaskAssignmentBoard component
 *
 * Features demonstrated:
 * - Displays tasks with TanStack Table-style layout
 * - Dropdown-based agent assignment (no drag-drop in v1)
 * - Capacity indicators showing X/Y tasks
 * - Search and filter by agent
 * - Optimistic updates with error handling
 */
export function TaskAssignmentBoardExample() {
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 mb-8">Task Assignment Board</h1>

        {/* Basic usage with defaults */}
        <TaskAssignmentBoard />

        {/* With custom capacity limit */}
        {/* <TaskAssignmentBoard maxAgentCapacity={10} /> */}

        {/* For a specific sprint */}
        {/* <TaskAssignmentBoard sprintId="sprint-1" maxAgentCapacity={8} /> */}
      </div>
    </div>
  )
}
