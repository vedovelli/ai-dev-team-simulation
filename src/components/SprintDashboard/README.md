# Sprint Dashboard Components

A comprehensive UI system for managing and monitoring sprint progress with responsive layout, real-time updates, and accessibility support.

## Components

### SprintDashboard

Main container component that orchestrates the entire dashboard experience.

**Props:**
- `sprintId?: string` - Selected sprint ID, synced with URL query params
- `sprints?: Array<{ id: string; name: string; status: string }>` - Available sprints for selection

**Features:**
- URL-driven navigation via `?sprintId=` query parameter
- Real-time update indicator
- Sprint information card with progress bar
- Responsive grid layout (mobile, tablet, desktop)
- Error states with retry buttons
- Empty states when no sprint is selected

**Usage:**
```tsx
import { SprintDashboard } from '@/components/SprintDashboard'

const sprints = [
  { id: 'sprint-1', name: 'Sprint 1', status: 'active' },
  { id: 'sprint-2', name: 'Sprint 2', status: 'todo' },
]

<SprintDashboard sprintId="sprint-1" sprints={sprints} />
```

---

### SprintSelector

Dropdown component for selecting which sprint to view.

**Props:**
- `sprints: Sprint[]` - List of available sprints
- `currentSprintId?: string` - Currently selected sprint ID
- `isLoading?: boolean` - Shows skeleton when loading

**Features:**
- Accessible select element with ARIA labels
- Integrates with TanStack Router for URL navigation
- Shows active sprint indicator
- Loading skeleton support

**Usage:**
```tsx
<SprintSelector
  sprints={mockSprints}
  currentSprintId="sprint-2"
/>
```

---

### SprintOverview

Stats card grid showing key sprint metrics.

**Props:**
- `totalTasks: number` - Total tasks in sprint
- `completedTasks: number` - Completed tasks count
- `inProgressTasks: number` - In-progress tasks count
- `blockedTasks: number` - Blocked tasks count
- `isLoading?: boolean` - Shows skeletons when loading

**Features:**
- 4-column grid on large screens, responsive on mobile/tablet
- Color-coded stats (success, info, danger)
- Loading state with skeleton cards
- ARIA labels for screen readers

**Usage:**
```tsx
<SprintOverview
  totalTasks={20}
  completedTasks={12}
  inProgressTasks={5}
  blockedTasks={1}
/>
```

---

### BurndownChart

CSS-based burndown chart visualization.

**Props:**
- `data: BurndownDataPoint[]` - Array of `{ day, plannedTasks, completedTasks }`
- `isLoading?: boolean` - Shows skeleton when loading
- `hasError?: boolean` - Shows error state
- `onRetry?: () => void` - Callback for retry button

**Features:**
- Day-by-day progress visualization
- Planned vs completed comparison
- Responsive bar chart
- Error state with retry
- Tooltip on hover
- ARIA attributes for accessibility

**BurndownDataPoint:**
```typescript
interface BurndownDataPoint {
  day: number
  plannedTasks: number
  completedTasks: number
}
```

**Usage:**
```tsx
const burndownData = [
  { day: 1, plannedTasks: 20, completedTasks: 2 },
  { day: 2, plannedTasks: 18, completedTasks: 5 },
]

<BurndownChart data={burndownData} />
```

---

### TeamCapacityPanel

Team member cards showing task assignments and utilization.

**Props:**
- `members: TeamMember[]` - Array of team members with capacity info
- `isLoading?: boolean` - Shows skeletons when loading
- `hasError?: boolean` - Shows error state
- `onRetry?: () => void` - Callback for retry button

**Features:**
- Visual capacity utilization bars
- Color-coded status (green < 75%, orange 75-100%, red > 100%)
- Completed/assigned task counts
- Over-capacity warning
- Responsive design
- ARIA progressbar attributes

**TeamMember:**
```typescript
interface TeamMember {
  id: string
  name: string
  assignedTasks: number
  completedTasks: number
  capacity: number
}
```

**Usage:**
```tsx
const team = [
  {
    id: '1',
    name: 'Alice',
    assignedTasks: 4,
    completedTasks: 2,
    capacity: 5
  },
]

<TeamCapacityPanel members={team} />
```

---

## Responsive Layout

All components use Tailwind CSS for responsive design:

- **Mobile** (default): Single column, full width
- **Tablet** (md): 2 columns for grids
- **Desktop** (lg): 3-4 columns with multi-column layouts

Example grid layout in SprintDashboard:
```
Mobile:        Tablet:           Desktop:
┌──────┐      ┌────┬────┐      ┌────────┬────┐
│Chart │      │ Burndown │      │  Burndown   │Capacity│
│      │      │         │      │   (2 cols)  │(1 col) │
├──────┤      ├────────┤      ├────────┼────┤
│Capacity      │Capacity│
│      │      │        │
└──────┘      └────┴────┘      └────────┴────┘
```

---

## Loading & Error States

### Loading Skeletons
- Dashboard: `DashboardSkeleton`
- Cards: `MetricCardSkeleton`
- Tables: `TableSkeleton`

Components automatically show skeletons when `isLoading={true}`.

### Error States
- Red background cards with error message
- Retry button triggers `onRetry` callback
- Components handle both "loading error" and "data error" states

### Empty States
- Friendly message when no data available
- Different messages for "no sprint selected" vs "no team members"

---

## Accessibility

All components include:

✓ **ARIA Labels & Roles**
- `aria-label` on all buttons and inputs
- `role="progressbar"` on utilization bars
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on progress bars

✓ **Keyboard Navigation**
- Select dropdowns are fully keyboard accessible
- Button focus states visible
- Tab order logical

✓ **Color Independence**
- Status conveyed via icon + color (not color alone)
- Text labels always present
- Sufficient color contrast (WCAG AA)

✓ **Screen Reader Support**
- Semantic HTML (section, main, nav)
- Descriptive button/link text
- Skip links for long content

---

## Styling

Uses Tailwind CSS with dark theme:
- Background: `bg-slate-800` (dark)
- Text: `text-slate-100` to `text-slate-400` (light)
- Accent colors: Blue (info), Green (success), Orange (warning), Red (danger)
- Borders: `border-slate-700`

All interactive elements have:
- Hover states (`hover:bg-slate-700`)
- Focus states (`focus:ring-2 focus:ring-blue-500`)
- Transitions (`transition-colors`)

---

## URL-Driven Navigation

SprintDashboard supports URL-based sprint selection:

```typescript
// /dashboard?sprintId=sprint-2
<SprintDashboard />

// Routes to:
// /dashboard?sprintId=sprint-3
// When user changes sprint selector
```

Managed by TanStack Router with `validateSearch`:
```typescript
export const Route = createFileRoute('/dashboard')({
  validateSearch: (search) => ({
    sprintId: search?.sprintId as string | undefined,
  }),
})
```

---

## Example

See `SprintDashboardExample.tsx` for full usage example with mock data.

```tsx
import { SprintDashboardExample } from '@/components/SprintDashboard'

<SprintDashboardExample />
```

---

## Mock Data

Components accept mock data for development/testing:

```tsx
const mockSprints = [
  { id: 'sprint-1', name: 'Sprint 1', status: 'completed' },
  { id: 'sprint-2', name: 'Sprint 2', status: 'active' },
]

const mockBurndown = [
  { day: 1, plannedTasks: 20, completedTasks: 2 },
  { day: 2, plannedTasks: 18, completedTasks: 5 },
]

const mockTeam = [
  { id: '1', name: 'Alice', assignedTasks: 4, completedTasks: 2, capacity: 5 },
]
```

---

## Integration with API

When integrating with real API:

1. Use TanStack Query hooks (e.g., `useSprint`, `useSprints`)
2. Pass `isLoading` and `error` to show appropriate states
3. Update dashboard when sprint selection changes
4. Real-time updates show "Updating..." indicator

```tsx
function DashboardPage() {
  const { sprintId } = useSearch()
  const { data, isLoading, error } = useSprint(sprintId)

  return (
    <SprintDashboard
      sprintId={sprintId}
      isLoading={isLoading}
      error={error}
    />
  )
}
```
