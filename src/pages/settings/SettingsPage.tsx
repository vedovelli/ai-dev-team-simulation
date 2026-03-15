import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { SettingsLayout } from '../../components/SettingsLayout/SettingsLayout'

export function SettingsPage() {
  const router = useRouter()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Warn user before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  // Monitor route changes for unsaved changes
  useEffect(() => {
    const unsubscribe = router.subscribe('onBeforeLoad', ({ toLocation }) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        )
        if (!confirmed) {
          return false
        }
      }
    })

    return unsubscribe
  }, [hasUnsavedChanges, router])

  return <SettingsLayout />
}
