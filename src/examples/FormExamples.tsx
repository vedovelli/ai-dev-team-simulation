import { useState } from 'react'
import { AgentProfileForm } from '../components/AgentProfileForm'
import { SprintConfigurationForm } from '../components/SprintConfigurationForm'

/**
 * Example usage of concrete TanStack Form implementations
 *
 * This component demonstrates how to use AgentProfileForm and SprintConfigurationForm
 * in a real application. It shows form submission handling and state management.
 */

export const FormExamples = () => {
  const [activeTab, setActiveTab] = useState<'agent' | 'sprint'>('agent')
  const [agentSubmitResult, setAgentSubmitResult] = useState<string | null>(null)
  const [sprintSubmitResult, setSprintSubmitResult] = useState<string | null>(null)

  const handleAgentProfileSubmit = async (data) => {
    try {
      const response = await fetch('/api/agents/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save agent profile')
      }

      const result = await response.json()
      setAgentSubmitResult(`✓ ${result.message}`)
      setTimeout(() => setAgentSubmitResult(null), 3000)
    } catch (error) {
      setAgentSubmitResult(
        `✗ ${error instanceof Error ? error.message : 'An error occurred'}`
      )
    }
  }

  const handleSprintConfigSubmit = async (data) => {
    try {
      const response = await fetch('/api/sprints/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to configure sprint')
      }

      const result = await response.json()
      setSprintSubmitResult(`✓ ${result.message}`)
      setTimeout(() => setSprintSubmitResult(null), 3000)
    } catch (error) {
      setSprintSubmitResult(
        `✗ ${error instanceof Error ? error.message : 'An error occurred'}`
      )
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">TanStack Form Examples</h1>
        <p className="text-slate-400 mb-8">
          Concrete form implementations demonstrating TanStack Form patterns
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'agent'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Agent Profile Form
          </button>
          <button
            onClick={() => setActiveTab('sprint')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'sprint'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sprint Configuration Form
          </button>
        </div>

        {/* Agent Profile Form Tab */}
        {activeTab === 'agent' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Agent Profile Form</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <AgentProfileForm
                  onSubmit={handleAgentProfileSubmit}
                  initialData={{
                    name: 'Alex Chen',
                    role: 'junior',
                    email: 'alex@example.com',
                    startDate: '2024-01-15',
                    isActive: true,
                    status: 'working',
                    bio: 'Frontend developer learning React and TypeScript.',
                  }}
                />
              </div>

              {/* Form Details */}
              <div>
                <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                  <h3 className="text-xl font-semibold">Form Details</h3>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">
                      Field Types Demonstrated
                    </h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li>• Text input (name)</li>
                      <li>• Email input (email)</li>
                      <li>• Select dropdown (role, status)</li>
                      <li>• Date input (startDate)</li>
                      <li>• Textarea (bio)</li>
                      <li>• Checkbox (isActive)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">
                      Validations
                    </h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li>• Name: 2-100 characters</li>
                      <li>• Email: Valid email format</li>
                      <li>• Start date: Not in future</li>
                      <li>• Bio: Max 500 characters</li>
                      <li>• Cross-field: Can't deactivate working agents</li>
                    </ul>
                  </div>

                  {agentSubmitResult && (
                    <div
                      className={`p-3 rounded text-sm ${
                        agentSubmitResult.startsWith('✓')
                          ? 'bg-green-900/30 text-green-400 border border-green-700'
                          : 'bg-red-900/30 text-red-400 border border-red-700'
                      }`}
                    >
                      {agentSubmitResult}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sprint Configuration Form Tab */}
        {activeTab === 'sprint' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Sprint Configuration Form</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <SprintConfigurationForm
                  onSubmit={handleSprintConfigSubmit}
                  initialData={{
                    name: 'Sprint 8 - Core Features',
                    duration: 14,
                    startDate: '2026-03-09',
                    endDate: '2026-03-22',
                    maxPoints: 40,
                    includeBufferDay: true,
                    goals: 'Implement user authentication and profile management',
                  }}
                />
              </div>

              {/* Form Details */}
              <div>
                <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                  <h3 className="text-xl font-semibold">Form Details</h3>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">
                      Field Types Demonstrated
                    </h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li>• Text input (name)</li>
                      <li>• Number input (duration, maxPoints)</li>
                      <li>• Date inputs (startDate, endDate)</li>
                      <li>• Textarea (goals)</li>
                      <li>• Checkbox (includeBufferDay)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">
                      Validations
                    </h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li>• Name: 3-100 chars, alphanumeric</li>
                      <li>• Duration: 1-56 days</li>
                      <li>• Start date: Not in past</li>
                      <li>• End date: Matches duration</li>
                      <li>• Max points: 10-200 story points</li>
                      <li>• Retro date: After sprint end</li>
                    </ul>
                  </div>

                  {sprintSubmitResult && (
                    <div
                      className={`p-3 rounded text-sm ${
                        sprintSubmitResult.startsWith('✓')
                          ? 'bg-green-900/30 text-green-400 border border-green-700'
                          : 'bg-red-900/30 text-red-400 border border-red-700'
                      }`}
                    >
                      {sprintSubmitResult}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Implementation Notes */}
        <div className="mt-12 bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Implementation Notes</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              • Both forms use TanStack Form directly without schema abstraction
            </p>
            <p>
              • Validation runs on blur to avoid excessive checks during typing
            </p>
            <p>
              • Cross-field validation accesses other fields via form.getFieldValue()
            </p>
            <p>
              • Form submissions are handled via MSW mocks in development
            </p>
            <p>
              • See docs/TANSTACK_FORM_PATTERNS.md for detailed pattern documentation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
