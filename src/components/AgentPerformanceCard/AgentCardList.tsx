import { useAgentMetrics } from '../../hooks/useAgentMetrics'
import { AgentPerformanceCard } from './AgentPerformanceCard'
import { MetricCardSkeleton } from '../Skeletons'

interface AgentCardListProps {
  /**
   * Optional title for the section
   * @default 'Agent Performance'
   */
  title?: string

  /**
   * Optional number of columns for the grid
   * @default responsive based on screen size
   */
  columns?: 'auto' | '1' | '2' | '3'
}

/**
 * Renders a responsive grid of AgentPerformanceCard components
 * Fetches agent metrics from useAgentMetrics hook
 * Handles loading and error states gracefully
 */
export function AgentCardList({
  title = 'Agent Performance',
  columns = 'auto',
}: AgentCardListProps) {
  const { data: agents = [], isLoading, error } = useAgentMetrics()

  // Grid column classes
  const gridColsClass =
    columns === 'auto'
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : columns === '1'
        ? 'grid-cols-1'
        : columns === '2'
          ? 'grid-cols-1 md:grid-cols-2'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-200">{title}</h2>
        <div className={`grid ${gridColsClass} gap-4`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-200">{title}</h2>
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 text-red-200">
          <p className="font-semibold mb-2">Error loading agent performance</p>
          <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (agents.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-200">{title}</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
          <p>No agents available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-200">{title}</h2>
      <div className={`grid ${gridColsClass} gap-4`}>
        {agents.map((agent) => (
          <AgentPerformanceCard key={agent.agentId} agent={agent} />
        ))}
      </div>
    </div>
  )
}
