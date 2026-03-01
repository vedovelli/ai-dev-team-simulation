import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { ReactNode } from 'react'

interface DroppableProps {
  id: string
  items: string[]
  children: ReactNode
}

export function Droppable({ id, items, children }: DroppableProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        {children}
      </div>
    </SortableContext>
  )
}
