# Sprint Planning Modal with Advanced Form Validation

## Overview

This document describes the implementation of FAB-146: Sprint Planning Modal with Advanced Form Validation. The feature extends the existing SprintFormDialog with comprehensive validation, capacity planning, and team assignment capabilities.

## Architecture

### Components

#### SprintFormDialog (Enhanced)
- **File**: `src/components/SprintFormDialog/SprintFormDialog.tsx`
- **Responsibility**: Manages sprint creation/editing with TanStack Form integration
- **Key Features**:
  - Date range validation with real-time feedback
  - Team member assignment with multi-select
  - Capacity warning indicators
  - Cross-field validation integration

**Props**:
```typescript
interface SprintFormDialogProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  sprint?: Sprint
  onClose: () => void
  onSubmit: (data: SprintFormData) => Promise<void>
}
```

**Form Data**:
```typescript
interface SprintFormData {
  name: string
  goals: string
  status: 'planning' | 'active' | 'completed'
  estimatedPoints: number
  startDate: string
  endDate: string
  assignedAgents: string[]
}
```

### Custom Hooks

#### useSprintForm
- **File**: `src/hooks/useSprintForm.ts`
- **Purpose**: Encapsulates all sprint form logic and validation
- **Public API**:

```typescript
const {
  validateDateRange,        // Validates end date > start date
  calculateSprintDuration,  // Returns days between start and end
  checkAgentCapacity,       // Single agent capacity check
  validateTeamCapacity,     // Team-wide capacity validation
  getAvailableAgents,       // Fetches available team members
  validateForm,             // Cross-field validation
} = useSprintForm()
```

### API Endpoints (MSW Mocked)

#### POST /api/sprints/capacity/check
Validates team capacity for sprint planning.

**Request**:
```typescript
{
  agentIds: string[]        // List of agent IDs to assign
  estimatedPoints: number   // Sprint estimated story points
}
```

**Response**:
```typescript
{
  isValid: boolean
  utilizationRate: number   // Average team utilization 0-100%
  message?: string          // Warning or error message
}
```

**Validation Rules**:
- Max 10 tasks per agent per sprint
- Warn at 85% utilization rate
- Prevent assignment if capacity exceeded

#### GET /api/agents/:id/capacity
Returns individual agent capacity.

**Response**:
```typescript
{
  currentLoad: number       // Current task load
  maxCapacity: number       // Maximum capacity (10 tasks)
}
```

## Validation Strategy

### Date Validation
- End date must be strictly after start date
- Invalid date formats are rejected with user-friendly errors
- Validation occurs on blur and on value change
- Visual feedback: red border on error

### Capacity Planning
- **Real-time checks**: Triggered when agents or points change
- **Warning system**: Yellow warning box for capacity concerns
- **Non-blocking**: Warnings don't prevent form submission
- **Granular**: Per-agent and team-level checks

**Capacity Calculation**:
```
availableCapacity = maxCapacity - currentLoad
utilizationRate = (currentLoad / maxCapacity) * 100
```

### Cross-Field Validation
- Date range must be valid before capacity check
- Capacity validation only runs if agents are assigned
- Form submission blocked only for critical errors (invalid dates, missing name)

## UI/UX Details

### Team Assignment Field
- Multi-select dropdown for agent selection
- Each agent shows current utilization rate
- Helper text: "Hold Ctrl/Cmd to select multiple team members"
- Loading state: "Loading team members..." while fetching
- Empty state: "No available team members" if none match criteria

### Visual Feedback
- **Red border + error text**: Date range invalid, required fields missing
- **Yellow warning box**: Capacity concerns (non-blocking)
- **Disabled submit**: Only when critical errors exist
- **Button states**: 
  - Creating.../Updating... when submitting
  - Disabled if name is empty or status is not selected

## Implementation Notes

### Key Decisions

1. **Non-blocking Capacity Warnings**: Capacity issues show warnings but don't prevent submission. This allows planning edge cases while alerting users to potential bottlenecks.

2. **Date Validation on Change**: Validates immediately on input change, not just on blur, for faster feedback.

3. **Isolated API Calls**: Each validation concern (dates, capacity) is validated independently, allowing graceful degradation if one check fails.

4. **Optimistic Agent Loading**: Loads available agents on dialog open, not on every form render, to minimize unnecessary API calls.

## Testing Scenarios

### Success Cases
1. Create sprint with valid date range and no team assignment
2. Create sprint with multiple assigned agents and sufficient capacity
3. Edit sprint and update assigned team members
4. Create sprint with dates that trigger capacity warnings (non-blocking)

### Validation Cases
1. Enter end date before start date → shows error
2. Assign agents with insufficient capacity → shows warning
3. Submit sprint with invalid dates → form rejected at submission
4. Assign agent at 100% capacity → shows warning message

### Edge Cases
1. Network error checking capacity → allows submission (graceful degradation)
2. No available agents → shows helpful message
3. Select same agent multiple times → deduplicated by form
4. Edit completed sprint → prevents date changes (MSW enforced)

## Performance Considerations

- **Agent Loading**: Debounced on dialog open, not on every render
- **Capacity Checks**: Only run when agents or points change
- **Form Fields**: Lazy evaluation of validators using TanStack Form
- **Query Caching**: Leverages TanStack Query for agent data

## Future Enhancements

1. **Sprint Duration Templates**: Pre-fill start/end based on common sprint lengths (1-3 weeks)
2. **Capacity Timeline**: Show agent availability throughout sprint duration
3. **Conflict Detection**: Warn if assigned agents have overlapping sprint assignments
4. **Historical Velocity**: Use past sprint data to predict realistic estimated points
5. **Team Roles**: Filter agents by role compatibility with sprint requirements

## Related Issues

- **FAB-145**: Sprint Planning - parent planning issue
- **FAB-200**: Sprint Form Dialog (base implementation)
- **FAB-126**: Task Assignment Hook (capacity logic reuse)

## Files Modified

1. `src/hooks/useSprintForm.ts` (NEW)
2. `src/components/SprintFormDialog/SprintFormDialog.tsx` (ENHANCED)
3. `src/mocks/handlers/sprints.ts` (ENHANCED)

## Breaking Changes

None. This feature extends existing SprintFormDialog without changing its public API. The `assignedAgents` field is optional in the form data and defaults to an empty array.
