/* eslint-disable react-refresh/only-export-components */
// The route component is passed to createFileRoute and exported as Route,
// so react-refresh won't detect it as a component export directly
import { createFileRoute } from '@tanstack/react-router'
import { CreateTaskForm } from '../components/CreateTaskForm'

export const Route = createFileRoute('/create')({
  component: CreatePage,
})

function CreatePage() {
  return <CreateTaskForm />
}
