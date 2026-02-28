/* eslint-disable react-refresh/only-export-components */
// The route component is passed to createFileRoute and exported as Route,
// so react-refresh won't detect it as a component export directly
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/create')({
  component: CreatePage,
})

function CreatePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <h1 className="text-3xl font-bold">Create</h1>
    </main>
  )
}
