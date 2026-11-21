import type { Tag as TagType } from '../types/task'

interface TagProps {
  tag: TagType
  className?: string
  /** Si fourni, affiche un petit bouton × au survol pour détacher le tag de la tâche */
  onRemove?: () => void
}

export function Tag({ tag, className = '', onRemove }: TagProps) {
  return (
    <span
      className={`group/tag inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
        color: '#6b7280', // Texte en gris plus clair
        border: `1px solid ${tag.color || '#d1d5db'}`
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          aria-label={`Supprimer le tag ${tag.name} de la tâche`}
          title={`Supprimer le tag ${tag.name} de la tâche`}
          className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full opacity-0 group-hover/tag:opacity-100 hover:bg-red-100 hover:text-red-600 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
