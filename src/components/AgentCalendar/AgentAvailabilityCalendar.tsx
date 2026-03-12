import { useState, useCallback } from 'react'
import { useAgentAvailability, useAvailableAgents } from '../../hooks'
import { AgentCalendarView } from './AgentCalendarView'

/**
 * Complete agent availability calendar with agent selector
 * Handles agent selection, month navigation, and data fetching
 */
export function AgentAvailabilityCalendar() {
  const { data: agents = [], isLoading: agentsLoading } = useAvailableAgents()
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || '')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: availabilityData, isLoading: availabilityLoading } = useAgentAvailability(
    selectedAgentId,
    month,
    year
  )

  const handleAgentChange = useCallback((agentId: string) => {
    setSelectedAgentId(agentId)
  }, [])

  const handleMonthChange = useCallback((newMonth: number, newYear: number) => {
    setMonth(newMonth)
    setYear(newYear)
  }, [])

  const isLoading = agentsLoading || availabilityLoading

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Loading agents...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Agent selector */}
      <div className="flex items-center gap-4">
        <label htmlFor="agent-select" className="font-medium text-gray-700">
          Select Agent:
        </label>
        <select
          id="agent-select"
          value={selectedAgentId}
          onChange={(e) => handleAgentChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Choose an agent --</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      {selectedAgentId ? (
        <AgentCalendarView
          availability={availabilityData?.dailyAvailability || []}
          month={month}
          year={year}
          onMonthChange={handleMonthChange}
          isLoading={isLoading}
        />
      ) : (
        <div className="flex items-center justify-center min-h-96 bg-gray-50 rounded-lg">
          <div className="text-gray-500">Please select an agent to view availability</div>
        </div>
      )}
    </div>
  )
}
