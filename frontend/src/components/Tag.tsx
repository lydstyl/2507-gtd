import type { Tag as TagType } from '../types/task'

interface TagProps {
  tag: TagType
  className?: string
}

export function Tag({ tag, className = '' }: TagProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
        color: '#6b7280', // Texte en gris plus clair
        border: `1px solid ${tag.color || '#d1d5db'}`
      }}
    >
      {tag.name}
    </span>
  )
} 