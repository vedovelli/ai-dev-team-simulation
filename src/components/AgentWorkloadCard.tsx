import type { WorkloadData, WorkloadMetrics } from '../hooks/useAgentWorkload'

interface AgentWorkloadCardProps {
  workload: WorkloadData
  metrics: WorkloadMetrics
}

/**
 * Display workload card for a single agent
 * Shows utilization, task count, and capacity status
 */
export function AgentWorkloadCard({
  workload,
  metrics,
}: AgentWorkloadCardProps) {
  const getUtilizationColor = (status: string) => {
    switch (status) {
      case 'overloaded':
        return 'bg-red-100 border-red-300 text-red-900'
      case 'balanced':
        return 'bg-green-100 border-green-300 text-green-900'
      case 'underutilized':
        return 'bg-blue-100 border-blue-300 text-blue-900'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-200 text-green-800'
      case 'busy':
        return 'bg-orange-200 text-orange-800'
      case 'blocked':
        return 'bg-red-200 text-red-800'
      case 'idle':
        return 'bg-gray-200 text-gray-800'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  const capacityPercentage = Math.round(workload.utilizationPercent * 100) / 100

  return (
    <div
      className={`border rounded-lg p-4 ${getUtilizationColor(
        metrics.utilization
      )}`}
    >
      {/* Header: Agent name and role */}
      <div className='flex items-start justify-between mb-3'>
        <div className='flex-1'>
          <h3 className='font-semibold text-sm'>{workload.agentId}</h3>
          <p className='text-xs opacity-75 capitalize'>{workload.role}</p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
            workload.status
          )}`}
        >
          {workload.status}
        </span>
      </div>

      {/* Utilization bar */}
      <div className='mb-3'>
        <div className='flex justify-between items-center mb-1'>
          <span className='text-xs font-medium'>Utilization</span>
          <span className='text-xs font-bold'>{capacityPercentage}%</span>
        </div>
        <div className='w-full bg-black/20 rounded-full h-2'>
          <div
            className='h-2 rounded-full bg-current transition-all'
            style={{
              width: `${Math.min(capacityPercentage, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Task and capacity stats */}
      <div className='grid grid-cols-2 gap-2 text-xs mb-3'>
        <div>
          <p className='opacity-75'>Active Tasks</p>
          <p className='font-bold text-base'>{workload.activeTasksCount}</p>
        </div>
        <div>
          <p className='opacity-75'>Estimated Hours</p>
          <p className='font-bold text-base'>
            {workload.totalEstimatedHours}h
          </p>
        </div>
      </div>

      {/* Capacity and metrics */}
      <div className='border-t border-current/20 pt-2 text-xs space-y-1'>
        <div className='flex justify-between'>
          <span className='opacity-75'>Capacity</span>
          <span className='font-semibold'>{workload.sprintCapacity}h</span>
        </div>
        <div className='flex justify-between'>
          <span className='opacity-75'>Remaining</span>
          <span className='font-semibold'>
            {Math.max(0, metrics.capacityRemaining)}h
          </span>
        </div>
        <div className='flex justify-between'>
          <span className='opacity-75'>Avg Task Size</span>
          <span className='font-semibold'>{metrics.averageTaskSize}h</span>
        </div>
      </div>

      {/* Utilization status label */}
      <div className='mt-3 text-center'>
        <span className='text-xs font-bold uppercase tracking-wide'>
          {metrics.utilization}
        </span>
      </div>
    </div>
  )
}
