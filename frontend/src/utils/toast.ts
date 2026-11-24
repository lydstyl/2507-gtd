// Toast bus minimaliste : un événement "showToast" par mutation réussie.
// Le rendu visuel est géré par <ToastHost /> (components/ui/ToastHost.tsx).

type ToastListener = (message: string) => void

const listeners = new Set<ToastListener>()

export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function showToast(message: string): void {
  listeners.forEach((listener) => listener(message))
}

interface ToastRule {
  method: 'POST' | 'PUT' | 'DELETE'
  pattern: RegExp
  message: string
}

// Règles d'ordre important : les plus spécifiques d'abord.
const MUTATION_RULES: ToastRule[] = [
  { method: 'POST', pattern: /^\/tasks\/[^/]+\/complete$/, message: 'Tâche terminée ✓' },
  { method: 'POST', pattern: /^\/tasks\/[^/]+\/worked-on$/, message: 'Tâche modifiée ✓' },
  { method: 'POST', pattern: /^\/tasks\/import$/, message: 'Import terminé ✓' },
  { method: 'DELETE', pattern: /^\/tasks\/all$/, message: 'Toutes les tâches supprimées ✓' },
  { method: 'DELETE', pattern: /^\/tasks\/[^/]+$/, message: 'Tâche supprimée ✓' },
  { method: 'PUT', pattern: /^\/tasks\/[^/]+$/, message: 'Tâche modifiée ✓' },
  { method: 'POST', pattern: /^\/tasks$/, message: 'Tâche créée ✓' },
  { method: 'PUT', pattern: /^\/tags\/positions$/, message: 'Tags réorganisés ✓' },
  { method: 'PUT', pattern: /^\/tags\/[^/]+$/, message: 'Tag modifié ✓' },
  { method: 'DELETE', pattern: /^\/tags\/[^/]+$/, message: 'Tag supprimé ✓' },
  { method: 'POST', pattern: /^\/tags$/, message: 'Tag créé ✓' },
]

/**
 * Appelé après chaque réponse 2xx de apiCall.
 * N'affiche un toast que pour les mutations tâches/tags (POST/PUT/DELETE).
 */
export function toastForMutation(
  method: string | undefined,
  endpoint: string
): void {
  if (!method) return
  const m = method.toUpperCase()
  if (m !== 'POST' && m !== 'PUT' && m !== 'DELETE') return
  const path = endpoint.split('?')[0]
  const rule = MUTATION_RULES.find(
    (r) => r.method === m && r.pattern.test(path)
  )
  if (rule) showToast(rule.message)
}
