import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentWorkloadCard } from '../AgentWorkloadCard'
import type { WorkloadAnalytics } from '../../../hooks/useWorkloadAnalytics'

describe('AgentWorkloadCard', () => {
  const mockWorkload: WorkloadAnalytics = {
    agentId: 'agent-1',
    name: 'Alice',
    activeTasksCount: 5,
    completedTasks: 20,
    averageCompletionTime: 3,
    capacityUtilization: 50,
    skillTags: ['code-review', 'refactoring'],
    completionTrend: 10,
    status: 'busy',
  }

  it('should render agent name and status', () => {
    const mockHandlers = {
      onDragStart: vi.fn(),
      onDragOver: vi.fn(),
      onDrop: vi.fn(),
    }

    render(
      <AgentWorkloadCard
        workload={mockWorkload}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('busy')).toBeInTheDocument()
  })

  it('should display capacity percentage', () => {
    const mockHandlers = {
      onDragStart: vi.fn(),
      onDragOver: vi.fn(),
      onDrop: vi.fn(),
    }

    render(
      <AgentWorkloadCard
        workload={mockWorkload}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('should render task count badges', () => {
    const mockHandlers = {
      onDragStart: vi.fn(),
      onDragOver: vi.fn(),
      onDrop: vi.fn(),
    }

    render(
      <AgentWorkloadCard
        workload={mockWorkload}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('5')).toBeInTheDocument() // active tasks
    expect(screen.getByText('20')).toBeInTheDocument() // completed
  })

  it('should display skill tags', () => {
    const mockHandlers = {
      onDragStart: vi.fn(),
      onDragOver: vi.fn(),
      onDrop: vi.fn(),
    }

    render(
      <AgentWorkloadCard
        workload={mockWorkload}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('code-review')).toBeInTheDocument()
    expect(screen.getByText('refactoring')).toBeInTheDocument()
  })

  it('should call onDragStart when dragged', () => {
    const mockHandlers = {
      onDragStart: vi.fn(),
      onDragOver: vi.fn(),
      onDrop: vi.fn(),
    }

    const { container } = render(
      <AgentWorkloadCard
        workload={mockWorkload}
        {...mockHandlers}
      />
    )

    const card = container.firstChild as HTMLElement
    const dragEvent = new DragEvent('dragstart')
    card.dispatchEvent(dragEvent)

    expect(mockHandlers.onDragStart).toHaveBeenCalled()
  })
})
