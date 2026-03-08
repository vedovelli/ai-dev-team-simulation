# Agent Settings & Preferences Panel Implementation

## Overview

This document describes the implementation of FAB-143: Agent Settings & Preferences Panel. The feature allows admin users (Fabio) to configure agent behavior including task priority filters, auto-assignment settings, and notification preferences.

## Architecture

### Components

#### AgentSettingsModal
Location: `src/components/AgentSettingsModal.tsx`

A modal dialog for displaying and editing agent settings. Features:
- TanStack Form for form state management
- Field-level validation with error display
- Optimistic updates with automatic rollback
- Loading states during fetch and mutation
- Cross-field validation (e.g., ensuring at least one notification preference is enabled)
- Accessible modal with keyboard support (Escape to close)

**Props:**
```typescript
interface AgentSettingsModalProps {
  isOpen: boolean           // Whether modal is open
  agentId: string          // ID of agent to configure
  onClose: () => void      // Callback when modal closes
}
```

**Usage:**
```tsx
const [isSettingsOpen, setIsSettingsOpen] = useState(false)
const [selectedAgentId, setSelectedAgentId] = useState('')

return (
  <>
    <button onClick={() => {
      setSelectedAgentId('agent-123')
      setIsSettingsOpen(true)
    }}>
      Configure Settings
    </button>

    <AgentSettingsModal
      isOpen={isSettingsOpen}
      agentId={selectedAgentId}
      onClose={() => setIsSettingsOpen(false)}
    />
  </>
)
```

### Hooks

#### useUpdateAgentSettings
Location: `src/hooks/mutations/useUpdateAgentSettings.ts`

Mutation hook for updating agent settings. Features:
- Optimistic updates: Changes appear immediately in UI
- Automatic rollback on error
- Cache invalidation for agent list and activity feed
- Retry logic via `useMutationWithRetry`

**Usage:**
```typescript
const updateMutation = useUpdateAgentSettings(agentId)

await updateMutation.mutateAsync({
  agentId,
  taskPriorityFilter: 'high',
  autoAssignmentEnabled: true,
  maxConcurrentTasks: 5,
  notificationPreferences: {
    onTaskAssigned: true,
    onTaskCompleted: true,
    dailyDigest: false,
  }
})
```

#### useAgentSettings
Location: `src/hooks/queries/useAgentSettings.ts`

Query hook for fetching agent settings. Features:
- Automatic polling with stale-while-revalidate strategy
- Exponential backoff retry
- Cancels pending requests when agentId changes

**Usage:**
```typescript
const { data: settings, isLoading, error } = useAgentSettings(agentId)
```

### Validation

#### Schema: agentSettingsSchema
Location: `src/lib/validation.ts`

Zod schema for agent settings with comprehensive validation:

```typescript
agentSettingsSchema = z.object({
  agentId: z.string().min(1),
  taskPriorityFilter: z.enum(['all', 'high', 'medium', 'low']),
  autoAssignmentEnabled: z.boolean(),
  maxConcurrentTasks: z.number().min(1).max(10),
  notificationPreferences: z.object({
    onTaskAssigned: z.boolean(),
    onTaskCompleted: z.boolean(),
    dailyDigest: z.boolean(),
  }),
})
```

**Validation Rules:**
1. `maxConcurrentTasks` must be 1-10
2. At least one notification preference must be enabled
3. If auto-assignment is enabled, `maxConcurrentTasks` must be set
4. Async validation checks for conflicts with other agents' rules

### API Endpoints

All endpoints use TanStack Query for state management and MSW for mocking.

#### GET /api/agents/:id/settings
Fetch current agent settings.

**Response:**
```json
{
  "agentId": "agent-1",
  "taskPriorityFilter": "all",
  "autoAssignmentEnabled": false,
  "maxConcurrentTasks": 5,
  "notificationPreferences": {
    "onTaskAssigned": true,
    "onTaskCompleted": true,
    "dailyDigest": false
  }
}
```

#### PUT /api/agents/:id/settings
Update agent settings. Validates all constraints and returns updated settings.

**Request:**
```json
{
  "agentId": "agent-1",
  "taskPriorityFilter": "high",
  "autoAssignmentEnabled": true,
  "maxConcurrentTasks": 8,
  "notificationPreferences": {
    "onTaskAssigned": true,
    "onTaskCompleted": true,
    "dailyDigest": true
  }
}
```

**Error Responses:**
- 400: Invalid input, constraints violated
- 404: Agent not found

#### POST /api/agents/validate-settings
Async validation endpoint for checking conflicts between agent settings.

**Request:**
```json
{
  "agentId": "agent-1",
  "autoAssignmentEnabled": true
}
```

**Response:**
```json
{
  "isValid": true,
  "message": "Auto-assignment configuration is valid"
}
```

### Settings Schema

```typescript
interface AgentSettings {
  agentId: string                      // Unique agent identifier
  taskPriorityFilter: 'all' | 'high' | 'medium' | 'low'  // Which priorities to assign
  autoAssignmentEnabled: boolean       // Auto-assign compatible tasks
  maxConcurrentTasks: number           // 1-10 concurrent tasks allowed
  notificationPreferences: {
    onTaskAssigned: boolean            // Notify when task assigned
    onTaskCompleted: boolean           // Notify when task completed
    dailyDigest: boolean               // Receive daily activity digest
  }
}
```

## Integration Example

### In Agent Management Page

```tsx
import { useState } from 'react'
import { AgentSettingsModal } from '@/components/AgentSettingsModal'

export function AgentManagement() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState('')

  const handleOpenSettings = (agentId: string) => {
    setSelectedAgentId(agentId)
    setIsSettingsOpen(true)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Agent Management</h1>
      </div>

      {/* Agent list or table */}
      <div className="space-y-2">
        {agents.map((agent) => (
          <div key={agent.id} className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-medium">{agent.name}</h3>
              <p className="text-sm text-gray-600">{agent.status}</p>
            </div>
            <button
              onClick={() => handleOpenSettings(agent.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Settings
            </button>
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      <AgentSettingsModal
        isOpen={isSettingsOpen}
        agentId={selectedAgentId}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
```

## Form Validation Flow

The form implements a comprehensive validation strategy:

1. **Client-side validation** - Immediate feedback on blur
   - Required field validation
   - Type validation
   - Range validation (maxConcurrentTasks)

2. **Cross-field validation** - Validates relationships between fields
   - If auto-assignment enabled, maxConcurrentTasks must be set
   - At least one notification preference must be enabled

3. **Async validation** - Checks for conflicts via API
   - Validates auto-assignment rules against other agents
   - Debounced to avoid excessive API calls

4. **Error display** - Clear, user-friendly error messages
   - Field-level error display
   - API error banner at top of form
   - Helpful tooltips for complex validations

## Optimistic Updates

When user saves settings:

1. **Request sent** - Form shows loading state
2. **Optimistic update** - Settings appear updated immediately in UI
3. **Response arrives** -
   - Success: UI stays updated, cache invalidated
   - Error: UI reverts to previous values, error shown to user

## State Management

### Query Structure

```
agents/
  [agentId]/
    settings/          # Query key: ['agents', agentId, 'settings']
```

### Invalidation Strategy

When settings are updated:
1. Cache for specific agent settings is updated
2. Agent list cache is invalidated (settings affect agent behavior)
3. Activity feed is invalidated (settings may affect task assignments)

## Testing

### Unit Tests (Recommended)

```typescript
describe('AgentSettingsModal', () => {
  it('validates maxConcurrentTasks range', async () => {
    // Test that values outside 1-10 range are rejected
  })

  it('requires at least one notification preference', async () => {
    // Test that unchecking all notifications shows error
  })

  it('shows cross-field validation for auto-assignment', async () => {
    // Test that enabling auto-assignment requires maxConcurrentTasks
  })

  it('shows optimistic updates', async () => {
    // Test that changes appear immediately
  })

  it('reverts on error', async () => {
    // Test that failed mutations rollback changes
  })
})
```

## Accessibility

- Modal has proper ARIA attributes (`role="dialog"`, `aria-modal="true"`)
- Form labels are properly associated with inputs (`htmlFor`)
- Error messages are semantically marked as errors
- Keyboard navigation supported (Tab, Escape to close)
- Focus management within modal

## Performance Considerations

1. **Lazy loading** - Settings fetched only when modal opens
2. **Debounced validation** - Async validation calls are debounced
3. **Cache reuse** - Settings cached with 30s stale time
4. **Optimistic updates** - No loading delay for user feedback

## Future Enhancements

1. **Validation conflict resolution** - Show which agents have conflicting rules
2. **Setting presets** - Quick-apply common configuration templates
3. **Bulk operations** - Apply settings to multiple agents at once
4. **Audit logging** - Track who changed settings and when
5. **Settings templates** - Save and reuse configurations

## Related Issues

- FAB-141: Sprint Planning Dashboard (parent)
- FAB-87: Agent Task Queue System
- FAB-91: Agent Performance Dashboard

## References

- TanStack Form: [https://tanstack.com/form](https://tanstack.com/form)
- TanStack Query: [https://tanstack.com/query](https://tanstack.com/query)
- Zod Validation: [https://zod.dev](https://zod.dev)
