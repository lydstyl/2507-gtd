import type { Tag } from '../types/task'

interface ShortcutsHelpProps {
  showShortcutsHelp: boolean
  setShowShortcutsHelp: (show: boolean | ((prev: boolean) => boolean)) => void
  tags: Tag[]
  pinnedTaskId: string | null
}

export function ShortcutsHelp({
  showShortcutsHelp,
  setShowShortcutsHelp,
  tags,
  pinnedTaskId
}: ShortcutsHelpProps) {
  return (
    <>
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
          {pinnedTaskId && (
            <span className='text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded ml-2'>
              Tâche fixée en haut de la liste
            </span>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {showShortcutsHelp && (
        <>
          <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900'>
            <div className='font-semibold mb-1'>
              Raccourcis clavier (sur la tâche sélectionnée) :
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
              <div>
                <b>I</b> / <b>Shift+I</b> : Importance +10/-10
              </div>
              <div>
                <b>C</b> / <b>Shift+C</b> : Complexité +2/-2
              </div>
              <div>
                <b>D</b> / <b>Shift+D</b> : Date +1j / -1j
              </div>
              <div>
                <b>W</b> : +1 semaine à la date
              </div>
              <div>
                <b>M</b> : +1 mois à la date
              </div>
              <div>
                <b>T</b> : Date à aujourd'hui
              </div>
              <div>
                <b>E</b> : Enlever la date
              </div>
              <div>
                <b>A</b> : Toutes les tâches en retard à aujourd'hui
              </div>
              <div>
                <b>1-9</b> : Ajouter/enlever tag 1 à 9
              </div>
              <div>
                <b>F</b> : Fixer/défixer la tâche sélectionnée en haut
              </div>
              <div>
                <b>H</b> : Afficher/cacher cette aide
              </div>
              <div>
                <b>↑ / ↓</b> : Sélectionner la tâche précédente/suivante
              </div>
              <div>
                <b>Espace</b> : Marquer comme fait/non fait
              </div>
              <div>
                <b>Suppr</b> : Supprimer la tâche (avec confirmation)
              </div>
            </div>
          </div>

          {/* Dynamic tag display 1-9 */}
          {tags.length > 0 && (
            <div className='mb-6'>
              <div className='text-xs text-gray-600 mb-1'>
                Tags accessibles par raccourci :
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
