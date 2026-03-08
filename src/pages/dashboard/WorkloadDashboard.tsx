import { WorkloadDashboard as Dashboard } from '../../components/WorkloadDashboard'

/**
 * Workload Dashboard Page
 * Container for the agent workload balancing dashboard
 * Shows team capacity planning and task distribution
 */
export function WorkloadDashboardPage() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Navigation Header */}
      <header className='border-b border-gray-200 bg-white sticky top-0 z-40'>
        <div className='max-w-7xl mx-auto px-8 py-6'>
          <h1 className='text-2xl font-bold text-gray-900'>
            Workload Balancing
          </h1>
          <p className='text-sm text-gray-600 mt-1'>
            Strategic capacity planning and team utilization metrics
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-8 py-8'>
        <Dashboard />
      </main>
    </div>
  )
}
