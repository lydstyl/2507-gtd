import { useEffect, useState } from 'react'
import { api } from '../utils/api'

const QUICK_PICKS = [50, 100, 200, 500]

// Modèle interne : '' = sans limite, sinon un entier >= 10.
function normalize(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v).trim()
  if (s === '') return ''
  const n = Number(s)
  if (!Number.isFinite(n)) return ''
  if (n < 10) return ''
  return String(Math.floor(n))
}

export function PourIaWordLimitSection() {
  const [value, setValue] = useState<string>('50') // '' = sans limite, sinon "50" etc.
  const [draft, setDraft] = useState<string>('50') // saisie libre (texte)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .getSettings()
      .then((s) => {
        if (cancelled) return
        const v = normalize(s.pourIaMaxWords)
        setValue(v)
        setDraft(v === '' ? '' : v)
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger les réglages.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const apply = (next: string) => {
    const clean = normalize(next)
    setValue(clean)
    setDraft(clean === '' ? '' : clean)
    setSaved(false)
    setSaving(true)
    setError(null)
    api
      .updateSettings({ pourIaMaxWords: clean })
      .then(() => setSaved(true))
      .catch(() => setError("Échec de l'enregistrement."))
      .finally(() => setSaving(false))
  }

  const handleQuickPick = (n: number) => apply(String(n))
  const handleNoLimit = () => apply('')
  const handleFreeSubmit = () => {
    const t = draft.trim()
    if (t === '') {
      apply('')
      return
    }
    const n = Number(t)
    if (!Number.isFinite(n) || n < 10) {
      setError('Minimum 10 mots (ou « Sans limite »).')
      return
    }
    apply(String(Math.floor(n)))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 text-sm text-gray-500">
        Chargement…
      </div>
    )
  }

  const isPicked = (n: number) => value === String(n)
  const isNoLimit = value === ''

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <p className="text-sm text-gray-600 mb-4">
        Nombre de mots maximum de la réponse générée par un LLM sur une tâche au
        statut <strong>« Pour IA »</strong>. Un tag{' '}
        <code className="bg-gray-100 px-1 rounded">IA_Nmots</code> sur la tâche
        passe toujours avant ce réglage. Défaut : 50 mots.
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_PICKS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleQuickPick(n)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              isPicked(n)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {n} mots
          </button>
        ))}
        <button
          type="button"
          onClick={handleNoLimit}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            isNoLimit
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          ♾️ Sans limite
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="pour-ia-words" className="text-sm text-gray-700">
          Saisie libre
        </label>
        <input
          id="pour-ia-words"
          type="number"
          min={10}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFreeSubmit()}
          className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleFreeSubmit}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-white hover:bg-gray-900"
        >
          Appliquer
        </button>
      </div>

      <div className="mt-3 text-sm">
        {saving && <span className="text-gray-500">Enregistrement…</span>}
        {saved && !saving && <span className="text-green-600">✅ Enregistré.</span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </div>
  )
}
