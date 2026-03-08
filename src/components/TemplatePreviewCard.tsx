import type { TaskTemplate } from '../types/template'

interface TemplatePreviewCardProps {
  template: TaskTemplate
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

export function TemplatePreviewCard({
  template,
  onEdit,
  onDelete,
  isDeleting,
}: TemplatePreviewCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
      {/* Header with color bar */}
      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {template.name}
        </h3>

        {template.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Default Fields Preview */}
        <div className="flex-1 bg-gray-50 rounded p-4 mb-4 space-y-2 text-sm">
          <h4 className="font-medium text-gray-900 text-xs uppercase tracking-wide mb-2">
            Default Fields
          </h4>

          {template.defaultFields.title ? (
            <div className="space-y-1">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Title:</span>
              </p>
              <p className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded border border-gray-200">
                {template.defaultFields.title}
              </p>
            </div>
          ) : null}

          {template.defaultFields.description ? (
            <div>
              <p className="text-xs text-gray-600 font-medium">Description:</p>
              <p className="text-gray-900 text-xs line-clamp-2">
                {template.defaultFields.description}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {template.defaultFields.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                Status: {template.defaultFields.status}
              </span>
            )}
            {template.defaultFields.priority && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-800 text-xs font-medium">
                Priority: {template.defaultFields.priority}
              </span>
            )}
          </div>

          {template.defaultFields.estimatedHours ? (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Est. Hours:</span>{' '}
              {template.defaultFields.estimatedHours}h
            </p>
          ) : null}

          {template.defaultFields.labels && template.defaultFields.labels.length > 0 ? (
            <div className="pt-2">
              <p className="text-xs text-gray-600 font-medium mb-1">Labels:</p>
              <div className="flex flex-wrap gap-1">
                {template.defaultFields.labels.map((label) => (
                  <span
                    key={label}
                    className="inline-block px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-xs"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 mb-4">
          <p>Created {new Date(template.createdAt).toLocaleDateString()}</p>
          {new Date(template.updatedAt) > new Date(template.createdAt) && (
            <p>Updated {new Date(template.updatedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t px-6 py-3 flex items-center gap-2 bg-gray-50">
        <button
          onClick={onEdit}
          disabled={isDeleting}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {isDeleting ? (
            <>
              <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </button>
      </div>
    </div>
  )
}
