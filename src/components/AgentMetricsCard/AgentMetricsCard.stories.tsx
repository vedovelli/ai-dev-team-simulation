import type { Meta, StoryObj } from '@storybook/react'
import { AgentMetricsCard, type AgentMetrics } from './AgentMetricsCard'

const meta: Meta<typeof AgentMetricsCard> = {
  component: AgentMetricsCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockMetrics: AgentMetrics = {
  completionRate: 85,
  averageTimeToComplete: 45,
  errorCount: 2,
}

export const Default: Story = {
  args: {
    agentName: 'Carlos',
    metrics: mockMetrics,
  },
}

export const HighPerformance: Story = {
  args: {
    agentName: 'Ana',
    metrics: {
      completionRate: 95,
      averageTimeToComplete: 30,
      errorCount: 0,
    },
  },
}

export const LowPerformance: Story = {
  args: {
    agentName: 'Junior Dev',
    metrics: {
      completionRate: 35,
      averageTimeToComplete: 120,
      errorCount: 8,
    },
  },
}

export const MediumPerformance: Story = {
  args: {
    agentName: 'Fabio',
    metrics: {
      completionRate: 65,
      averageTimeToComplete: 60,
      errorCount: 3,
    },
  },
}

export const Loading: Story = {
  args: {
    agentName: 'Carlos',
    metrics: mockMetrics,
    isLoading: true,
  },
}

export const ErrorState: Story = {
  args: {
    agentName: 'Carlos',
    metrics: mockMetrics,
    error: 'Failed to load metrics. Please try again.',
  },
}

export const ZeroErrors: Story = {
  args: {
    agentName: 'Perfect Agent',
    metrics: {
      completionRate: 100,
      averageTimeToComplete: 20,
      errorCount: 0,
    },
  },
}

export const ManyErrors: Story = {
  args: {
    agentName: 'Struggling Agent',
    metrics: {
      completionRate: 45,
      averageTimeToComplete: 180,
      errorCount: 15,
    },
  },
}
