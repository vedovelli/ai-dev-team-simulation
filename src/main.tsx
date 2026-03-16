import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import { routeTree } from './routeTree.gen'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer, NotificationToastProvider } from './components/NotificationToast'
const router = createRouter({ routeTree, context: { queryClient } })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider maxVisible={3}>
          <NotificationToastProvider />
          <RouterProvider router={router} />
          <ToastContainer />
          {import.meta.env.DEV && <ReactQueryDevtools />}
        </ToastProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  )
})
