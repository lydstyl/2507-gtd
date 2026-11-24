import { useEffect, useRef, useState } from 'react'
import { subscribeToast } from '../../utils/toast'

// Durée de vie d'un toast : 2 secondes (règle Gabriel 21/11/2026).
const DURATION_MS = 2000
const FADE_MS = 300

interface ToastItem {
  id: number
  message: string
  leaving: boolean
}

let nextId = 1

/**
 * Affiche les toasts (notifications éphémères) en haut de l'écran.
 * Montage global dans App.tsx.
 */
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<number[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToast((message) => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, message, leaving: false }])
      // Fade-out avant la disparition.
      timers.current.push(
        window.setTimeout(() => {
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
          )
        }, DURATION_MS - FADE_MS)
      )
      timers.current.push(
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, DURATION_MS)
      )
    })
    return () => {
      unsubscribe()
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
    }
  }, [])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-full bg-gray-900/95 px-5 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 dark:bg-gray-100/95 dark:text-gray-900 ${
            t.leaving ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
