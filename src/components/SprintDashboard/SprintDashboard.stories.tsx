import type { Meta, StoryObj } from '@storybook/react'
import { SprintSelector } from './SprintSelector'
import { SprintOverview } from './SprintOverview'
import { BurndownChart, type BurndownDataPoint } from './BurndownChart'
import { TeamCapacityPanel, type TeamMember } from './TeamCapacityPanel'

const meta: Meta = {
  title: 'Sprint Dashboard',
}

export default meta

const mockSprints = [
  { id: 'sprint-1', name: 'Sprint 1 - Foundation', status: 'completed' },
  { id: 'sprint-2', name: 'Sprint 2 - Core Features', status: 'active' },
  { id: 'sprint-3', name: 'Sprint 3 - Polish', status: 'todo' },
]

// SprintSelector Stories
export const SprintSelectorDefault: StoryObj = {
  render: () => <SprintSelector sprints={mockSprints} currentSprintId="sprint-2" />,
}

export const SprintSelectorLoading: StoryObj = {
  render: () => <SprintSelector sprints={[]} isLoading />,
}

// SprintOverview Stories
export const SprintOverviewDefault: StoryObj = {
  render: () => (
    <SprintOverview totalTasks={20} completedTasks={12} inProgressTasks={5} blockedTasks={1} />
  ),
}

export const SprintOverviewLoading: StoryObj = {
  render: () => <SprintOverview totalTasks={0} completedTasks={0} inProgressTasks={0} blockedTasks={0} isLoading />,
}

// BurndownChart Stories
const mockBurndownData: BurndownDataPoint[] = [
  { day: 1, plannedTasks: 20, completedTasks: 2 },
  { day: 2, plannedTasks: 18, completedTasks: 5 },
  { day: 3, plannedTasks: 15, completedTasks: 8 },
  { day: 4, plannedTasks: 12, completedTasks: 11 },
  { day: 5, plannedTasks: 10, completedTasks: 14 },
]

export const BurndownChartDefault: StoryObj = {
  render: () => <BurndownChart data={mockBurndownData} />,
}

export const BurndownChartLoading: StoryObj = {
  render: () => <BurndownChart data={[]} isLoading />,
}

export const BurndownChartEmpty: StoryObj = {
  render: () => <BurndownChart data={[]} />,
}

export const BurndownChartError: StoryObj = {
  render: () => <BurndownChart data={[]} hasError onRetry={() => console.log('Retry')} />,
}

// TeamCapacityPanel Stories
const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'Alice Johnson', assignedTasks: 4, completedTasks: 2, capacity: 5 },
  { id: '2', name: 'Bob Smith', assignedTasks: 5, completedTasks: 1, capacity: 5 },
  { id: '3', name: 'Charlie Brown', assignedTasks: 2, completedTasks: 1, capacity: 4 },
]

export const TeamCapacityPanelDefault: StoryObj = {
  render: () => <TeamCapacityPanel members={mockTeamMembers} />,
}

export const TeamCapacityPanelLoading: StoryObj = {
  render: () => <TeamCapacityPanel members={[]} isLoading />,
}

export const TeamCapacityPanelEmpty: StoryObj = {
  render: () => <TeamCapacityPanel members={[]} />,
}

export const TeamCapacityPanelError: StoryObj = {
  render: () => <TeamCapacityPanel members={[]} hasError onRetry={() => console.log('Retry')} />,
}

export const TeamCapacityPanelOverCapacity: StoryObj = {
  render: () => (
    <TeamCapacityPanel
      members={[
        { id: '1', name: 'Overloaded Dev', assignedTasks: 8, completedTasks: 2, capacity: 5 },
      ]}
    />
  ),
}
