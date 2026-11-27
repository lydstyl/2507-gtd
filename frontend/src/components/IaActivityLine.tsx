import { useEffect, useState } from 'react'
import type { Task } from '../types/task'
import { tasksApi } from '../services/api'

function relativeTime(iso?: string | null): string {
  if (!iso) return ''
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `il y a ${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return `il y a ${m} min`
  return `il y a ${Math.floor(m / 60)} h`
}

/**
 * Ligne d'activité agent en direct (tâche `ia_en_cours`) — 27/11/2026.
 *
 * « 🔍 lit la source · il y a 40 s » : l'agent met à jour `activity` à chaque
 * étape (PUT, horodatage serveur), un heartbeat wrapper (60 s) fait le filet.
 * Auto-refresh 5 s via GET /api/tasks/:id — uniquement actif sur les cartes
 * dont la tâche est en cours, coût nul ailleurs (rend null sinon).
 */
export function IaActivityLine({ task }: { task: Task }) {
  const [activity, setActivity] = useState<string | undefined>(task.activity)
  const [activityAt, setActivityAt] = useState<string | undefined>(task.activityAt)

  useEffect(() => {
    if (task.status !== 'ia_en_cours' || task.isCompleted) return
    let cancelled = false
    const load = () => {
      tasksApi
        .getTask(task.id)
        .then((t) => {
          if (cancelled) return
          setActivity(t.activity)
          setActivityAt(t.activityAt)
        })
        .catch(() => {
          /* API momentanément injoignable → on garde la dernière valeur */
        })
    }
    const id = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [task.id, task.status, task.isCompleted])

  if (task.status !== 'ia_en_cours' || task.isCompleted) return null

  const ago = relativeTime(activityAt)
  return (
    <p className='text-xs text-purple-700 mb-2 truncate' title={activity}>
      {activity ? `🔍 ${activity}${ago ? ` · ${ago}` : ''}` : '🤖 agent en cours…'}
    </p>
  )
}
