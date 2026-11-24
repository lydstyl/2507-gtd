import { useEffect, useRef } from 'react'

interface CompleteConfirmModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation avant de marquer une tâche comme terminée (touche X).
 * Une vraie confirmation (pas une alerte) : Entrée = confirmer, Esc = annuler.
 */
export function CompleteConfirmModal({ open, onConfirm, onCancel }: CompleteConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    // Focus sur « Oui, terminer » pour que Entrée confirme sans clic.
    const t = setTimeout(() => confirmRef.current?.focus(), 0)
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCancel()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        onConfirm()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', handler, true)
    }
  }, [open, onConfirm, onCancel])

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
      onMouseDown={onCancel}
    >
      <div
        className='w-80 max-w-[92vw] bg-white rounded-lg shadow-xl p-5'
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className='text-base font-semibold text-gray-900 mb-1'>
          Terminer cette tâche ?
        </h3>
        <p className='text-sm text-gray-600 mb-4'>
          La tâche sera sauvegardée puis marquée comme terminée.
        </p>
        <div className='flex justify-end gap-2'>
          <button
            onClick={onCancel}
            className='px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50'
          >
            Annuler <kbd className='ml-1 text-[10px] px-1 bg-gray-100 border rounded font-mono text-gray-500'>Esc</kbd>
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className='px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
          >
            Oui, terminer <kbd className='ml-1 text-[10px] px-1 bg-green-500 rounded font-mono'>Entrée</kbd>
          </button>
        </div>
      </div>
    </div>
  )
}
