/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/agents')({
  component: () => <Outlet />,
})
