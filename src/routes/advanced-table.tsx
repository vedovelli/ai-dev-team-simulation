import { createFileRoute } from '@tanstack/react-router'
import { AdvancedTableExample } from '../components/AdvancedTable/AdvancedTableExample'

export const Route = createFileRoute('/advanced-table')({
  component: AdvancedTableDemoPage,
})

function AdvancedTableDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <AdvancedTableExample />
      </div>
    </div>
  )
}
