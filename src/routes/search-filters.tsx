import { createFileRoute } from '@tanstack/react-router'
import { SearchFilterDemo } from '../components/SearchFilterDemo'

export const Route = createFileRoute('/search-filters')({
  component: SearchFiltersDemoPage,
})

function SearchFiltersDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <SearchFilterDemo />
      </div>
    </div>
  )
}
