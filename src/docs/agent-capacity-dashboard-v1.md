# Agent Capacity Dashboard v1 — Implementation Guide

## Overview

The Agent Capacity Dashboard v1 provides a simplified, management-facing view of agent workload and capacity warnings. It focuses on quick overview and status indicators without operational complexity.

**Version**: v1 (Simplified management view)
**Full version**: v2 deferred to Sprint #60 (heatmap, time estimates, detail modal)

## Architecture

### Data Flow

```
TanStack Query (60s polling)
         ↓
   GET /api/agents/metrics
         ↓
AgentCapacityDashboardV1
     ├── CapacityAlertBadge (X agents over 80%)
     ├── Summary Stats (Total, Average, Over Capacity)
     └── Agent List
         └── AgentCapacityBar × N (with ARIA labels)
```

### Query Strategy

- **Endpoint**: `GET /api/agents/metrics`
- **Polling**: 60 seconds (management-focused, lower frequency than real-time)
- **Stale Time**: 60 seconds
- **Retry**: Exponential backoff (3 attempts, 1s → 2s → 4s)
- **Cache**: 5 minutes (gcTime)
- **Refetch**: On window focus

## Components

### AgentCapacityDashboardV1

Main container component. Orchestrates data fetching, state, and layout.

**Props**: None (self-contained)

**States**:
- `isLoading`: Fetching initial data
- `error`: Query failed (displays error message)
- `data`: Agent metrics with timestamps

**Computed Values**:
- `overCapacityCount`: Count of agents > 80% utilized
- `avgCapacity`: Average utilization across team

**Example**:

```tsx
import { AgentCapacityDashboardV1 } from '@/components/AgentCapacityV1'

export function CapacityPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Agent Capacity</h1>
      <AgentCapacityDashboardV1 />
    </div>
  )
}
```

### AgentCapacityBar

Individual agent row with capacity bar and status label.

**Props**:
```typescript
interface AgentCapacityBarProps {
  agent: AgentCapacityMetric
}
```

**Status Colors**:
- 🟢 **Green** (<60%): "Available" — agent has capacity for new tasks
- 🟡 **Yellow** (60-80%): "At Capacity" — approaching limits
- 🔴 **Red** (>80%): "Over Capacity" — exceeds recommended load

**Accessibility**:
- `role="progressbar"` on capacity bar
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes
- `aria-label` with agent name and percentage
- Text label communicates status (not color-only)

**Example**:

```tsx
<AgentCapacityBar agent={agent} />
```

### CapacityAlertBadge

Summary chip showing number of agents over 80% capacity.

**Props**:
```typescript
interface CapacityAlertBadgeProps {
  overCapacityCount: number
  totalAgents: number
}
```

**States**:
- **Healthy** (0 agents over capacity): Green badge with checkmark
- **At Risk** (N agents over capacity): Red badge with warning icon

**Example**:

```tsx
<CapacityAlertBadge overCapacityCount={2} totalAgents={10} />
```

## Data Types

### AgentCapacityMetric

```typescript
interface AgentCapacityMetric {
  agentId: string              // e.g., "agent-1"
  name: string                 // e.g., "Alice Chen"
  currentLoad: number          // Current task count
  maxCapacity: number          // Capacity limit (typically 10)
  tasksAssigned: number        // Same as currentLoad
  utilizationPct: number       // 0-100 percentage
  warningLevel: WarningLevel   // 'ok' | 'warning' | 'critical'
}
```

### AgentCapacityMetricsV1Response

```typescript
interface AgentCapacityMetricsV1Response {
  agents: AgentCapacityMetric[]
  timestamp: string            // ISO 8601 timestamp
}
```

## Hook: useAgentCapacityMetricsV1

Data fetching hook for agent capacity metrics.

**Features**:
- 60s polling interval
- Exponential backoff retry
- Window focus refetch
- Stale-while-revalidate pattern

**Usage**:

```tsx
import { useAgentCapacityMetricsV1 } from '@/hooks'

export function MyComponent() {
  const { data, isLoading, error } = useAgentCapacityMetricsV1()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      {data?.agents.map(agent => (
        <AgentRow key={agent.agentId} agent={agent} />
      ))}
    </div>
  )
}
```

**Custom Polling**:

```tsx
const { data, isLoading, error } = useAgentCapacityMetricsV1({
  pollingInterval: 120000, // 2 minutes
})
```

## MSW Handler

The `/api/agents/metrics` endpoint generates synthetic agent data with realistic workload distribution.

**Endpoint**: `GET /api/agents/metrics`

**Response**:
```json
{
  "agents": [
    {
      "agentId": "agent-1",
      "name": "Alice Chen",
      "currentLoad": 6,
      "maxCapacity": 10,
      "tasksAssigned": 6,
      "utilizationPct": 60,
      "warningLevel": "warning"
    }
  ],
  "timestamp": "2026-03-14T10:30:45.123Z"
}
```

**Features**:
- Generates 10 agents with realistic workload distribution
- Updates every 30 seconds (cache TTL)
- Utilization ranges from 0-100%
- Warning level based on capacity thresholds

## Acceptance Criteria Checklist

- [x] MSW handler for `/api/agents/metrics` with realistic synthetic data
- [x] Agent list renders with capacity bars
- [x] Green/yellow/red status with text labels
- [x] Summary badge shows count of agents over 80%
- [x] 60s polling via TanStack Query
- [x] Full ARIA accessibility on progress bars
- [x] Implementation guide / docs

## Integration Example

### Add Route

```typescript
// src/routes/dashboard/agents/capacity-v1.tsx
import { AgentCapacityDashboardV1 } from '@/components/AgentCapacityV1'

export const Route = createFileRoute('/dashboard/agents/capacity-v1')({
  component: CapacityDashboardV1Page,
})

function CapacityDashboardV1Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Agent Capacity</h1>
        <p className="mt-1 text-slate-600">
          Real-time view of agent workload and capacity warnings
        </p>
      </div>
      <AgentCapacityDashboardV1 />
    </div>
  )
}
```

### Add Navigation Link

```typescript
// src/components/Navigation.tsx
<Link
  to="/dashboard/agents/capacity-v1"
  className="text-slate-600 hover:text-slate-900"
>
  Agent Capacity v1
</Link>
```

## Testing Patterns

### Test Data Generation

```typescript
// tests/fixtures/agent-capacity.ts
import type { AgentCapacityMetric } from '@/types/capacity'

export const mockAgent: AgentCapacityMetric = {
  agentId: 'agent-1',
  name: 'Test Agent',
  currentLoad: 6,
  maxCapacity: 10,
  tasksAssigned: 6,
  utilizationPct: 60,
  warningLevel: 'warning',
}

export const mockAgents: AgentCapacityMetric[] = [
  { ...mockAgent, agentId: 'agent-1', utilizationPct: 45 },
  { ...mockAgent, agentId: 'agent-2', utilizationPct: 72 },
  { ...mockAgent, agentId: 'agent-3', utilizationPct: 91 },
]
```

### Component Tests

```typescript
// AgentCapacityBar.test.tsx
import { render, screen } from '@testing-library/react'
import { AgentCapacityBar } from '@/components/AgentCapacityV1'
import { mockAgent } from '@/tests/fixtures/agent-capacity'

describe('AgentCapacityBar', () => {
  it('displays agent capacity information', () => {
    render(<AgentCapacityBar agent={mockAgent} />)
    expect(screen.getByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('renders progress bar with ARIA labels', () => {
    render(<AgentCapacityBar agent={mockAgent} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '60')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('shows correct status label for different utilization levels', () => {
    const { rerender } = render(
      <AgentCapacityBar agent={{ ...mockAgent, utilizationPct: 45 }} />
    )
    expect(screen.getByText('Available')).toBeInTheDocument()

    rerender(
      <AgentCapacityBar agent={{ ...mockAgent, utilizationPct: 70 }} />
    )
    expect(screen.getByText('At Capacity')).toBeInTheDocument()

    rerender(
      <AgentCapacityBar agent={{ ...mockAgent, utilizationPct: 85 }} />
    )
    expect(screen.getByText('Over Capacity')).toBeInTheDocument()
  })
})
```

## Performance Considerations

- **Query Caching**: 5-minute cache prevents unnecessary API calls
- **60s Polling**: Management view doesn't require real-time updates
- **No Virtual Scrolling**: v1 assumes reasonable agent count (<50). Optimize for large teams in v2
- **Memoization**: useMemo on agents list and summary metrics prevents unnecessary re-renders

## Accessibility Checklist

- [x] Semantic HTML (progress bars, badges)
- [x] ARIA labels on progress bars (valuenow, valuemin, valuemax)
- [x] Color + text labels (not color-only)
- [x] Keyboard navigable list structure
- [x] Error states with clear messages
- [x] Loading state with aria-live announcements

## Future Enhancements (v2)

- [ ] Heatmap view (time-series capacity over 24h)
- [ ] Estimated time to capacity freed
- [ ] Agent detail modal with task breakdown
- [ ] Filtering/search for agent names
- [ ] Export capacity report (CSV/PDF)
- [ ] Capacity trend analytics
- [ ] Team capacity planning recommendations
