import { useState } from 'react'
import { IMPORTANCE_MIN, IMPORTANCE_MAX, getImportanceQuadrant } from '../utils/taskUtils'

interface PriorityMatrixModalProps {
  isOpen: boolean
  onClose: () => void
  currentValue: number
  onSelect: (value: number) => void
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v))

/**
 * Matrice Urgence × Importance
 * Abscisse = importance, ordonnée = urgence.
 * 4 zones : basique / urgent / important / critique.
 * Un clic place le point de la tâche et calcule la priorité (100-499).
 */
export function PriorityMatrixModal({
  isOpen,
  onClose,
  currentValue,
  onSelect
}: PriorityMatrixModalProps) {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null)

  if (!isOpen) return null

  // Position initiale du point : celle de la priorité actuelle
  const initialValue = clamp(currentValue, IMPORTANCE_MIN, IMPORTANCE_MAX)
  const initQuadrant = getImportanceQuadrant(initialValue)
  const initFrac = (initialValue - initQuadrant.min) / 99
  const initX = initQuadrant.min >= 300 ? 50 + initFrac * 50 : initFrac * 50
  const initY = initQuadrant.min >= 200 ? 50 + initFrac * 50 : initFrac * 50

  const p = point ?? { x: initX, y: initY }

  const computeValue = (x: number, y: number): number => {
    // Quadrant : x < 50 = pas important, y < 50 = pas urgent
    const base =
      x >= 50 && y >= 50 ? 400 :
      x >= 50 ? 300 :
      y >= 50 ? 200 : 100
    const fx = x >= 50 ? (x - 50) / 50 : x / 50
    return base + Math.round(fx * 99)
  }

  const value = computeValue(p.x, p.y)
  const quadrant = getImportanceQuadrant(value)

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(100 - ((e.clientY - rect.top) / rect.height) * 100, 0, 100)
    setPoint({ x, y })
  }

  const handleApply = () => {
    onSelect(value)
    onClose()
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]'>
      <div className='bg-white rounded-lg shadow-xl max-w-sm w-full mx-4'>
        <div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>
            🎯 Matrice urgence / importance
          </h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        <div className='px-6 py-4'>
          <p className='text-xs text-gray-500 mb-3'>
            Clique pour placer la tâche : la priorité est choisie automatiquement.
          </p>

          <div className='flex items-stretch gap-1'>
            {/* Axe urgence */}
            <div className='flex flex-col items-center justify-between py-1 text-[10px] text-gray-500 w-6'>
              <span>Urgent</span>
              <span className='rotate-180' style={{ writingMode: 'vertical-rl' }}>Urgence ↑</span>
              <span>Calmes</span>
            </div>

            {/* Grille 2x2 */}
            <div
              className='relative flex-1 cursor-crosshair select-none'
              onClick={handleGridClick}
            >
              <div className='grid grid-cols-2 grid-rows-2 w-full h-56 rounded-md overflow-hidden border border-gray-300'>
                <div className='bg-orange-100 border-r border-b border-gray-300 flex flex-col items-center justify-center text-orange-800'>
                  <span className='text-lg'>⚡</span>
                  <span className='text-xs font-semibold'>Urgent</span>
                  <span className='text-[10px] text-gray-500'>pas important · urgent</span>
                </div>
                <div className='bg-red-100 border-b border-gray-300 flex flex-col items-center justify-center text-red-800'>
                  <span className='text-lg'>🔥</span>
                  <span className='text-xs font-semibold'>Critique</span>
                  <span className='text-[10px] text-gray-500'>important · urgent</span>
                </div>
                <div className='bg-gray-100 border-r border-gray-300 flex flex-col items-center justify-center text-gray-600'>
                  <span className='text-lg'>🐢</span>
                  <span className='text-xs font-semibold'>Basique</span>
                  <span className='text-[10px] text-gray-500'>pas important · pas urgent</span>
                </div>
                <div className='bg-blue-100 flex flex-col items-center justify-center text-blue-800'>
                  <span className='text-lg'>📌</span>
                  <span className='text-xs font-semibold'>Important</span>
                  <span className='text-[10px] text-gray-500'>important · pas urgent</span>
                </div>
              </div>

              {/* Point de la tâche */}
              <div
                className='absolute w-4 h-4 bg-gray-900 border-2 border-white rounded-full shadow-lg pointer-events-none'
                style={{
                  left: `calc(${p.x}% - 8px)`,
                  bottom: `calc(${p.y}% - 8px)`
                }}
                title={`Importance ${Math.round(p.x)}% · Urgence ${Math.round(p.y)}%`}
              />
            </div>
          </div>

          {/* Axe importance */}
          <div className='flex items-center justify-between mt-1 text-[10px] text-gray-500 ml-7'>
            <span>Pas important</span>
            <span>Importance →</span>
            <span>Important</span>
          </div>

          {/* Aperçu de la priorité */}
          <div className='mt-4 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2'>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${quadrant.badgeClass}`}>
              {quadrant.emoji} {quadrant.label}
            </span>
            <span className='text-sm font-bold text-gray-800'>
              Priorité : {value}
            </span>
          </div>
        </div>

        <div className='px-6 py-3 flex justify-end space-x-3 border-t border-gray-200'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
          >
            Annuler
          </button>
          <button
            type='button'
            onClick={handleApply}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          >
            Appliquer la priorité {value}
          </button>
        </div>
      </div>
    </div>
  )
}
