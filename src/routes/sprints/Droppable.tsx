import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'

interface DroppableProps {
  id: string
  children: ReactNode
}

export function Droppable({ id, children }: DroppableProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${
        isOver ? 'bg-blue-50' : ''
      }`}
    >
      {children}
    </div>
  )
}
