import { useEffect, useMemo, useRef, useState } from 'react'
import type { Tag } from '../types/task'

interface TagPickerModalProps {
  open: boolean
  tags: Tag[]
  selectedIds: string[]
  onToggle: (tagId: string) => void
  onClose: () => void
}

/** Recherche insensible aux accents et à la casse. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Sélecteur de tags accessible au clavier — solution scalable à 30, 100… tags.
 * Ouvert par la touche A (alias ` / Backquote). Tape pour filtrer, ↑↓ pour naviguer,
 * Entrée pour toggler le tag, Esc pour fermer. On peut en toggler plusieurs
 * avant de fermer.
 */
export function TagPickerModal({
  open,
  tags,
  selectedIds,
  onToggle,
  onClose,
}: TagPickerModalProps) {
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return tags
    return tags.filter((t) => normalize(t.name).includes(q))
  }, [query, tags])

  // Reset + focus au montage.
  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlight(0)
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  // Garde le highlight dans les bornes quand la liste change.
  useEffect(() => {
    if (highlight >= filtered.length) {
      setHighlight(Math.max(0, filtered.length - 1))
    }
  }, [filtered, highlight])

  // Scrolle l'élément highlighté dans le champ de vision.
  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  // Gère les touches du modal en phase CAPTURE (avant le hook global) :
  // Esc / Entrée / flèches. Le reste (lettres) tombe dans le champ de saisie.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        setHighlight((h) => Math.min(filtered.length - 1, h + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        setHighlight((h) => Math.max(0, h - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        const tag = filtered[highlight]
        if (tag) onToggle(tag.id)
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [open, filtered, highlight, onToggle, onClose])

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/40'
      onMouseDown={onClose}
    >
      <div
        className='w-[26rem] max-w-[92vw] bg-white rounded-lg shadow-xl overflow-hidden'
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className='px-3 py-2 border-b border-gray-200'>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setHighlight(0)
            }}
            placeholder='Chercher un tag…  (↑↓ · Entrée · Esc)'
            className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
        <ul ref={listRef} className='max-h-[52vh] overflow-y-auto py-1'>
          {filtered.map((tag, i) => {
            const checked = selectedIds.includes(tag.id)
            return (
              <li key={tag.id}>
                <button
                  onClick={() => onToggle(tag.id)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left ${
                    i === highlight ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${
                      checked
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span
                    className='w-3 h-3 rounded-full shrink-0'
                    style={{ backgroundColor: tag.color || '#6b7280' }}
                  />
                  <span className='text-gray-700 truncate'>{tag.name}</span>
                </button>
              </li>
            )
          })}
          {filtered.length === 0 && (
            <li className='px-3 py-4 text-sm text-gray-400 text-center'>
              Aucun tag « {query} »
            </li>
          )}
        </ul>
        <div className='px-3 py-1.5 border-t border-gray-200 text-[10px] text-gray-400'>
          {filtered.length}/{tags.length} tags · Entrée = toggler · Esc = fermer
        </div>
      </div>
    </div>
  )
}
