import type { Tag } from '../types/task'

/**
 * Aide « raccourcis clavier » — groupée et codée en couleur.
 *
 * Un composant unique, piloté par la data, partagé par :
 *   - la liste /tasks            → context="list"
 *   - la page détail /task/:id   → context="detail"
 *
 * Chaque groupe (statut, dates, tags, navigation…) est une carte avec une
 * bordure gauche colorée + un badge de titre : on repère une famille de
 * touches d'un coup d'œil, au lieu d'une longue liste plate.
 */

export type ShortcutsContext = 'list' | 'detail'

interface ShortcutItem {
  /** La touche (peut contenir des modificateurs : "⇧I", "Ctrl+S", "1-9"…). */
  key: string
  label: string
}

type GroupColor = 'blue' | 'amber' | 'green' | 'purple' | 'gray'

interface ShortcutGroup {
  id: string
  title: string
  color: GroupColor
  items: ShortcutItem[]
}

/**
 * Styles par couleur. Classes TAILWIND LITÉRALES (pas d'interpolation) pour
 * que le JIT les détecte. La palette n'a pas de "slate" → on utilise "gray".
 */
const GROUP_STYLES: Record<GroupColor, { border: string; badge: string }> = {
  blue: { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700' },
  amber: { border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-700' },
  green: { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700' },
  purple: { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700' },
  gray: { border: 'border-l-gray-400', badge: 'bg-gray-100 text-gray-700' },
}

// ── Familles de touches partagées ────────────────────────────────────────────

const STATUS_ITEMS: ShortcutItem[] = [
  { key: 'B', label: 'Brouillon' },
  { key: 'P', label: 'Pour IA' },
  { key: 'L', label: 'Collecté' },
  { key: 'R', label: 'Prêt' },
  { key: 'U', label: 'Un jour peut-être' },
  { key: 'N', label: 'IA en cours' },
  { key: 'V', label: 'Terminé par IA' },
]

const IMPACT_ITEMS: ShortcutItem[] = [
  { key: 'I / ⇧I', label: 'Importance ±10' },
  { key: 'C / ⇧C', label: 'Complexité ±2' },
]

const DATE_ITEMS_LIST: ShortcutItem[] = [
  { key: 'D / ⇧D', label: 'Date prévue ±1 j' },
  { key: 'W', label: 'Date +1 semaine' },
  { key: 'M', label: 'Date +1 mois' },
  { key: 'T', label: "Date = aujourd'hui" },
  { key: 'E', label: 'Enlever la date' },
  { key: 'A', label: 'Tous les retards → aujourd’hui' },
]

const DATE_ITEMS_DETAIL: ShortcutItem[] = [
  { key: 'D / ⇧D', label: 'Date ±1 j' },
  { key: 'W', label: 'Date +1 semaine' },
  { key: 'M', label: 'Date +1 mois' },
  { key: 'T', label: "Date = aujourd'hui" },
  { key: 'E', label: 'Effacer les dates' },
]

const TAGS_ITEMS_LIST: ShortcutItem[] = [{ key: '1-9', label: 'Ajouter / enlever tag' }]

const TAGS_ITEMS_DETAIL: ShortcutItem[] = [
  { key: '1-9', label: 'Toggle tag n° (9 premiers)' },
  { key: '`', label: 'Chercher un tag (tous)' },
]

const GENERAL_ITEMS_DETAIL: ShortcutItem[] = [
  { key: 'Ctrl+S', label: 'Sauvegarder' },
  { key: 'Esc', label: 'Retour' },
  { key: 'X', label: 'Terminer (confirmation)' },
  { key: 'H', label: 'Cette aide' },
]

const NAV_ITEMS_LIST: ShortcutItem[] = [
  { key: '↑ / ↓', label: 'Tâche précédente / suivante' },
  { key: 'Espace', label: 'Fait / non fait' },
  { key: 'Suppr', label: 'Supprimer (confirmation)' },
  { key: 'F', label: 'Fixer / défixer en haut' },
  { key: 'O', label: 'Plein écran (nouvel onglet)' },
  { key: 'S', label: 'Afficher / masquer les filtres' },
  { key: 'H', label: 'Cette aide' },
]

const GROUPS: Record<ShortcutsContext, ShortcutGroup[]> = {
  detail: [
    { id: 'statut', title: 'Statut', color: 'blue', items: STATUS_ITEMS },
    { id: 'impact', title: 'Importance & complexité', color: 'amber', items: IMPACT_ITEMS },
    { id: 'dates', title: 'Dates', color: 'green', items: DATE_ITEMS_DETAIL },
    { id: 'tags', title: 'Tags', color: 'purple', items: TAGS_ITEMS_DETAIL },
    { id: 'general', title: 'Général', color: 'gray', items: GENERAL_ITEMS_DETAIL },
  ],
  list: [
    { id: 'statut', title: 'Statut', color: 'blue', items: STATUS_ITEMS },
    { id: 'impact', title: 'Importance & complexité', color: 'amber', items: IMPACT_ITEMS },
    { id: 'dates', title: 'Dates', color: 'green', items: DATE_ITEMS_LIST },
    { id: 'tags', title: 'Tags', color: 'purple', items: TAGS_ITEMS_LIST },
    { id: 'nav', title: 'Navigation', color: 'gray', items: NAV_ITEMS_LIST },
  ],
}

interface ShortcutsHelpProps {
  showShortcutsHelp: boolean
  setShowShortcutsHelp: (show: boolean | ((prev: boolean) => boolean)) => void
  tags: Tag[]
  pinnedTaskId?: string | null
  /** "list" (page /tasks) ou "detail" (page /task/:id). Défaut : "list". */
  context?: ShortcutsContext
  /**
   * Rend le bouton "Afficher/cacher l'aide" au-dessus du panneau. La page
   * détail a déjà son propre bouton "⌨ Raccourcis (H)" → elle passe false.
   */
  showToggle?: boolean
}

export function ShortcutsHelp({
  showShortcutsHelp,
  setShowShortcutsHelp,
  tags,
  pinnedTaskId,
  context = 'list',
  showToggle = true
}: ShortcutsHelpProps) {
  const groups = GROUPS[context]
  const isList = context === 'list'

  return (
    <>
      {showToggle && (
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center'>
            <button
              className='text-xs text-blue-700 underline mr-2'
              onClick={() => setShowShortcutsHelp((v) => !v)}
            >
              {showShortcutsHelp
                ? "Cacher l'aide sur les raccourcis"
                : "Afficher l'aide sur les raccourcis"}
            </button>
            {isList && pinnedTaskId && (
              <span className='text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded ml-2'>
                Tâche fixée en haut de la liste
              </span>
            )}
          </div>
        </div>
      )}

      {/* Panneau des raccourcis (groupé + codé en couleur) */}
      {showShortcutsHelp && (
        <>
          <div className='mb-4 p-3 bg-gray-50 border border-gray-200 rounded'>
            <div className='font-semibold mb-2 text-gray-800'>
              Raccourcis clavier{isList ? ' (sur la tâche sélectionnée)' : ''} :
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
              {groups.map((group) => {
                const s = GROUP_STYLES[group.color]
                return (
                  <div
                    key={group.id}
                    className={`border-l-4 ${s.border} bg-white rounded p-2 shadow-sm`}
                  >
                    <div
                      className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mb-1.5 ${s.badge}`}
                    >
                      {group.title}
                    </div>
                    <ul className='space-y-1'>
                      {group.items.map((item) => (
                        <li key={item.key + item.label} className='flex items-baseline gap-1.5 text-xs'>
                          <span className='font-mono font-bold text-gray-900 whitespace-nowrap'>
                            {item.key}
                          </span>
                          <span className='text-gray-600'>: {item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
            <div className='mt-2 text-xs text-gray-600'>
              {isList ? (
                <>
                  Les raccourcis de <b>date</b> modifient la <b>date prévue</b>. La <b>date limite</b>{' '}
                  suit automatiquement la date prévue si elle deviendrait antérieure (la date limite
                  est toujours ≥ à la date prévue).
                  <br />
                  Les raccourcis de <b>statut (B/P/L/R/U/V)</b> marchent aussi en lisant la note d'une
                  tâche (modal ouvert, focus hors de l'éditeur de la note).
                </>
              ) : (
                <>
                  Mêmes lettres que la page /tasks. Inactifs quand le focus est dans un champ de saisie
                  (sauf Ctrl+S et Esc).
                </>
              )}
            </div>
          </div>

          {/* Affichage dynamique des tags 1-9 (liste uniquement) */}
          {isList && tags.length > 0 && (
            <div className='mb-6'>
              <div className='text-xs text-gray-600 mb-1'>
                Tags accessibles par raccourci (modifiable via le gestionnaire de tags) :
              </div>
              <div className='flex flex-wrap gap-2'>
                {tags.slice(0, 9).map((tag, idx) => (
                  <div
                    key={tag.id}
                    className='flex items-center px-2 py-1 rounded border border-gray-200 bg-gray-50 text-xs'
                  >
                    <span className='font-mono font-bold mr-1'>{idx + 1}.</span>
                    <span
                      className='w-3 h-3 rounded-full inline-block mr-1'
                      style={{ backgroundColor: tag.color || '#6b7280' }}
                    ></span>
                    <span>{tag.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
