/**
 * Garde-fou du formulaire de la page « tâche complète » (/task/:id).
 *
 * Contexte (bug 27/11/2026) : le bouton « Sauvegarder » était câblé
 * `onClick={handleSave}`. React appelle alors le handler avec l'événement de
 * clic en 1er argument, que `handleSave(formOverride?)` prenait pour un
 * formulaire :
 *   saveAll(event) → JSON.stringify(event) → « Converting circular structure
 *   to JSON » (l'événement React porte une FiberNode) → catch → bandeau
 *   « Une erreur inattendue s'est produite », aucun PUT, dates perdues.
 *
 * `resolveSaveForm` refuse tout argument qui n'a pas la forme exacte d'un
 * FormState : le formulaire vivant (`live`) est alors utilisé. Un futur
 * handler câblé directement sur un onClick ne peut donc plus corrompre la
 * sauvegarde.
 */

export interface SaveFormLike {
  name: unknown
  link: unknown
  importance: unknown
  complexity: unknown
  status: unknown
  plannedDate: unknown
  dueDate: unknown
  tagIds: unknown
}

/**
 * True seulement pour un objet qui porte TOUS les champs d'un FormState avec
 * leurs types. Un événement React, un tableau, un objet partiel ou un DOM
 * node sont rejetés.
 */
export function isSaveForm(candidate: unknown): candidate is SaveFormLike {
  if (candidate === null || typeof candidate !== 'object') return false
  if (Array.isArray(candidate)) return false
  const c = candidate as Record<string, unknown>
  return (
    typeof c.name === 'string' &&
    typeof c.link === 'string' &&
    typeof c.importance === 'number' &&
    typeof c.complexity === 'number' &&
    typeof c.status === 'string' &&
    typeof c.plannedDate === 'string' &&
    typeof c.dueDate === 'string' &&
    Array.isArray(c.tagIds) &&
    (c.tagIds as unknown[]).every((id) => typeof id === 'string')
  )
}

/**
 * Renvoie le formulaire à sauvegarder : l'override s'il est valide (raccourci
 * clavier passant le form déjà modifié), sinon le formulaire vivant.
 */
export function resolveSaveForm<T extends SaveFormLike>(
  candidate: unknown,
  live: T
): T {
  return isSaveForm(candidate) ? (candidate as T) : live
}
