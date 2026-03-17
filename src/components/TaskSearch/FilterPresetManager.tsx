/**
 * FilterPresetManager Component
 *
 * Manages saving, loading, and deleting filter presets using localStorage.
 * Allows users to save their current filter configuration and quickly restore it later.
 */

import { useState, useEffect } from 'react'
import type { TaskSearchFilters } from '../../types/task-search'

export interface FilterPreset {
  id: string
  name: string
  filters: TaskSearchFilters
  createdAt: string
}

interface FilterPresetManagerProps {
  currentFilters: TaskSearchFilters
  onLoadPreset: (filters: TaskSearchFilters) => void
}

const PRESETS_STORAGE_KEY = 'taskFilterPresets'

function generateId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function loadPresetsFromStorage(): FilterPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    console.warn('Failed to load filter presets from localStorage')
    return []
  }
}

function savePresetsToStorage(presets: FilterPreset[]): void {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
  } catch {
    console.warn('Failed to save filter presets to localStorage')
  }
}

export function FilterPresetManager({ currentFilters, onLoadPreset }: FilterPresetManagerProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [saveError, setError] = useState<string | null>(null)

  // Load presets on mount
  useEffect(() => {
    setPresets(loadPresetsFromStorage())
  }, [])

  const hasFiltersToSave = Object.values(currentFilters).some((v) => v !== undefined)

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      setError('Preset name is required')
      return
    }

    if (presets.some((p) => p.name === presetName.trim())) {
      setError('A preset with this name already exists')
      return
    }

    const newPreset: FilterPreset = {
      id: generateId(),
      name: presetName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    }

    const updated = [...presets, newPreset]
    setPresets(updated)
    savePresetsToStorage(updated)
    setPresetName('')
    setError(null)
  }

  const handleLoadPreset = (preset: FilterPreset) => {
    onLoadPreset(preset.filters)
    setIsOpen(false)
  }

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id)
    setPresets(updated)
    savePresetsToStorage(updated)
  }

  return (
    <div className="space-y-3">
      {/* Save Preset */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Preset name"
          value={presetName}
          onChange={(e) => {
            setPresetName(e.target.value)
            setError(null)
          }}
          disabled={!hasFiltersToSave}
          className="flex-1 px-3 py-2 rounded border border-slate-600 bg-slate-700 text-slate-300 text-sm placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter preset name"
        />
        <button
          onClick={handleSavePreset}
          disabled={!hasFiltersToSave || !presetName.trim()}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          aria-label="Save filter preset"
        >
          Save
        </button>
      </div>

      {/* Error Message */}
      {saveError && <p className="text-xs text-red-400">{saveError}</p>}

      {/* Presets Dropdown */}
      {presets.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-700 text-slate-300 text-sm hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
          >
            <span>
              {presets.length} saved preset{presets.length !== 1 ? 's' : ''}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded border border-slate-600 bg-slate-700 shadow-lg">
              <div className="max-h-48 overflow-y-auto">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-slate-600 border-b border-slate-600 last:border-b-0 gap-2"
                  >
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="flex-1 text-left text-sm text-slate-300 hover:text-white transition-colors"
                      title={`Load preset "${preset.name}"`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(preset.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title={`Delete preset "${preset.name}"`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
