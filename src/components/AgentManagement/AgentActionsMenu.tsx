import { useState, useRef, useEffect } from 'react'

interface AgentActionsMenuProps {
  agentId: string
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onViewDetails: (id: string) => void
}

export function AgentActionsMenu({
  agentId,
  onEdit,
  onDelete,
  onViewDetails,
}: AgentActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
        aria-label="Agent actions"
      >
        ⋯
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
          <button
            onClick={() => {
              onViewDetails(agentId)
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors first:rounded-t-lg"
          >
            View Details
          </button>
          <button
            onClick={() => {
              onEdit(agentId)
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => {
              onDelete(agentId)
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors last:rounded-b-lg"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
