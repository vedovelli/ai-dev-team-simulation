# Task Queue System

Advanced task queue management system demonstrating TanStack Table patterns with form integration, mutations, and complex interactions.

## Components

### TaskQueueTable
Main table component for managing task queues with advanced filtering and assignment.

**Features:**
- Multi-select row selection for bulk operations
- Real-time filtering by status, assignee, and sprint
- Column sorting (priority, status, sprint, etc.)
- Inline task assignment with dropdown
- Bulk assignment form for selected tasks
- Agent workload indicators with capacity warnings
- Color-coded priority and status badges

**Usage:**
```tsx
import { TaskQueueTable } from './TaskQueue'

function MyComponent() {
  const handleAssignTask = async (taskId: string, agentId: string) => {
    // Call API to assign task
  }

  const handleBulkAssign = async (taskIds: string[], agentId: string) => {
    // Call API to bulk assign tasks
  }

  return (
    <TaskQueueTable
      tasks={tasks}
      agents={agents}
      isLoading={isLoading}
      onAssignTask={handleAssignTask}
      onBulkAssign={handleBulkAssign}
    />
  )
}
```

### AssignmentCell
Inline editor for task-to-agent assignment with validation feedback.

**Props:**
- `task: Task` - Task being assigned
- `agents: Agent[]` - Available agents for selection
- `isEditing: boolean` - Whether cell is in edit mode
- `onAssignmentChange: (taskId, agentId) => Promise<void>` - Assignment handler
- `onEditToggle: (taskId, isEditing) => void` - Toggle edit mode
- `isLoading?: boolean` - Loading state

### BulkAssignmentForm
Form for assigning multiple selected tasks to a single agent.

**Props:**
- `selectedCount: number` - Number of selected tasks
- `agents: Agent[]` - Available agents
- `onSubmit: (agentId, skillMatch?) => Promise<void>` - Form submission
- `onCancel: () => void` - Cancel operation
- `isLoading?: boolean` - Loading state

**Validation:**
- Required agent selection
- Workload limit checking (max 10 tasks per agent)
- Optional skill matching verification

### WorkloadIndicator
Visual indicator showing agent task count and capacity status.

**Props:**
- `agentName: string` - Name to display
- `currentTasks: number` - Current task count
- `maxTasks: number` - Maximum capacity
- `status: 'Available' | 'Near Capacity' | 'Overloaded'` - Derived from utilization

**Colors:**
- Green: < 75% capacity (Available)
- Yellow: 75-100% capacity (Near Capacity)
- Red: > 100% capacity (Overloaded)

## Hooks

### useTaskQueueTable
Enhanced hook for task queue state management with multi-select support.

**Returns:**
- `sortedAndFilteredData: Task[]` - Processed tasks
- `selectedTaskIds: Set<string>` - Selected task IDs
- `sortKey: keyof Task | null` - Current sort column
- `sortOrder: 'asc' | 'desc'` - Sort direction
- `filters: TaskFilters` - Active filters
- `handleSort: (key) => void` - Sort handler
- `handleFilterChange: (filters) => void` - Filter handler
- `toggleSelectTask: (taskId) => void` - Toggle single selection
- `selectAllTasks: (taskIds) => void` - Select all in current view
- `clearSelection: () => void` - Clear all selections
- `isTaskSelected: (taskId) => boolean` - Check if task is selected
- `selectedCount: number` - Count of selected tasks

**Usage:**
```tsx
const {
  sortedAndFilteredData,
  selectedTaskIds,
  handleSort,
  toggleSelectTask,
} = useTaskQueueTable({ data: tasks })
```

## Data Layer Integration

### MSW Handlers
Mock endpoints for development and testing:

#### GET /api/tasks/queue
Fetch task queue with filtering.

**Query Parameters:**
- `status?: TaskStatus` - Filter by task status
- `assignee?: string` - Filter by assigned agent
- `sprint?: string` - Filter by sprint

**Response:**
```json
{
  "success": true,
  "data": [{ Task }],
  "total": number
}
```

#### POST /api/tasks/:id/assign
Assign a task to an agent.

**Request Body:**
```json
{
  "agentId": "agent-1"
}
```

**Validation:**
- Agent exists
- Agent not at maximum capacity (10 tasks)
- Warns on low-skill agent with high-priority task

**Response:**
```json
{
  "success": true,
  "data": { Task },
  "message": "Task assigned to {agentName}"
}
```

#### POST /api/tasks/assign-bulk
Bulk assign multiple tasks to one agent.

**Request Body:**
```json
{
  "taskIds": ["1", "2", "3"],
  "agentId": "agent-1"
}
```

**Validation:**
- Agent not at maximum capacity with new assignments
- All tasks exist

**Response:**
```json
{
  "success": true,
  "data": [{ Task }],
  "message": "N tasks assigned to {agentName}"
}
```

#### GET /api/agents/availability
Check agent workload and capacity status.

**Response:**
```json
{
  "success": true,
  "data": {
    "agent-1": {
      "currentTasks": 7,
      "maxTasks": 10,
      "workload": "medium"
    }
  }
}
```

## Patterns Demonstrated

### 1. Multi-Select Management
```tsx
const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())

const toggleSelectTask = (taskId: string) => {
  setSelectedTaskIds(prev => {
    const next = new Set(prev)
    next.has(taskId) ? next.delete(taskId) : next.add(taskId)
    return next
  })
}
```

### 2. Inline Editing
Task assignment happens inline within table cells, toggling between view and edit modes.

### 3. Form Integration with Table
Bulk operations form appears conditionally based on selection state, demonstrating tight form-table integration.

### 4. Mutation with Optimistic Updates (API Ready)
```tsx
const handleAssignTask = async (taskId: string, agentId: string) => {
  // Local update first for responsiveness
  setTasks(prev =>
    prev.map(t => t.id === taskId ? { ...t, assignee: agentId } : t)
  )

  // Then call API
  const res = await fetch(`/api/tasks/${taskId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ agentId }),
  })

  // Rollback on error
  if (!res.ok) {
    // Restore previous state
  }
}
```

### 5. Workload Validation
Both inline and bulk assignment validate agent capacity:
```tsx
if (agentTaskCount > 10) {
  throw new Error(`Agent is at maximum capacity`)
}
```

## Advanced Features

### Filtering
Filter by status, assignee, and sprint simultaneously. Filters work client-side on the current data set.

### Sorting
Click column headers to sort. Click again to reverse direction. Priority column uses custom sort order (low < medium < high).

### Selection
- Click checkboxes to select individual tasks
- Click header checkbox to select all visible tasks
- Selection persists across filter changes
- Bulk form shows only when tasks are selected

### Capacity Warnings
WorkloadIndicator shows utilization:
- Exact task count vs. max capacity
- Color-coded status based on utilization percentage
- Enables intelligent assignment decisions

## Example Usage

See `TaskQueueExample.tsx` for a complete working example with:
- Task fetching from mock API
- Agent availability checking
- Assignment error handling
- Success message display

## Future Enhancements

- Drag-and-drop for assignment
- Skill-based assignment suggestions
- Workload balancing helpers
- Assignment history and audit trail
- Real-time collaboration indicators
