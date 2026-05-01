import { useState } from 'react'
import { useApiKeys, useCreateApiKey, useRegenerateApiKey, useRevokeApiKey } from '../hooks/useApiKeys'
import type { ApiKeyCreated } from '../types/auth'

export function ApiKeysSection() {
  const { data: keys, isLoading } = useApiKeys()
  const createMutation = useCreateApiKey()
  const regenerateMutation = useRegenerateApiKey()
  const revokeMutation = useRevokeApiKey()

  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState<ApiKeyCreated | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    const result = await createMutation.mutateAsync({ name: newKeyName.trim() })
    setNewKeyName('')
    setRevealedKey(result)
    setCopied(false)
  }

  const handleRegenerate = async (id: string) => {
    const result = await regenerateMutation.mutateAsync(id)
    setRevealedKey(result)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (revealedKey?.key) {
      await navigator.clipboard.writeText(revealedKey.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Revealed key banner */}
      {revealedKey && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">
                ⚠️ Nouvelle clé générée — copiez-la maintenant !
              </h3>
              <p className="text-xs text-yellow-700 mt-1">
                Cette clé ne sera <strong>plus jamais affichée</strong> après fermeture.
              </p>
              <code className="mt-2 block bg-yellow-100 px-3 py-2 rounded text-sm font-mono text-yellow-900 break-all select-all">
                {revealedKey.key}
              </code>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 transition-colors whitespace-nowrap"
              >
                {copied ? '✓ Copié !' : '📋 Copier'}
              </button>
              <button
                onClick={() => setRevealedKey(null)}
                className="px-3 py-1.5 text-xs font-medium rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create new key */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Créer une nouvelle clé API</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Nom (ex: MCP Hermes, Dokimo...)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={100}
          />
          <button
            onClick={handleCreate}
            disabled={!newKeyName.trim() || createMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {createMutation.isPending ? 'Création...' : '➕ Créer'}
          </button>
        </div>
        {createMutation.error && (
          <p className="text-red-600 text-xs mt-2">
            Erreur : {(createMutation.error as Error).message}
          </p>
        )}
      </div>

      {/* Existing keys list */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Clés API existantes</h3>
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            <div className="animate-spin inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2" />
            Chargement...
          </div>
        ) : !keys || keys.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Aucune clé API. Créez-en une ci-dessus.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {keys.map((key) => (
              <li key={key.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {key.name}
                    </span>
                    {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                        Expirée
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <code className="text-xs text-gray-500 font-mono">{key.prefix}…</code>
                    <span className="text-xs text-gray-400">
                      Créée le {formatDate(key.createdAt)}
                    </span>
                    {key.lastUsedAt && (
                      <span className="text-xs text-gray-400">
                        · Dernière utilisation : {formatDate(key.lastUsedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleRegenerate(key.id)}
                    disabled={regenerateMutation.isPending}
                    className="px-2.5 py-1.5 text-xs font-medium rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors whitespace-nowrap"
                  >
                    {regenerateMutation.isPending ? '...' : '🔄 Regénérer'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Révoquer la clé "${key.name}" ? Cette action est irréversible.`)) {
                        revokeMutation.mutate(key.id)
                      }
                    }}
                    disabled={revokeMutation.isPending}
                    className="px-2.5 py-1.5 text-xs font-medium rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors whitespace-nowrap"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* MCP configuration hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">🔧 Configuration MCP</h3>
        <p className="text-xs text-blue-700 mb-2">
          Pour utiliser cette clé avec le MCP Hermes, mettez à jour la variable d'environnement
          du serveur MCP puis redémarrez-le :
        </p>
        <code className="block bg-blue-100 px-3 py-2 rounded text-xs font-mono text-blue-900 whitespace-pre-wrap">
          {`# Sur le serveur :
pm2 stop gtd-mcp
GTD_API_TOKEN=VOTRE_CLE_ICI pm2 start gtd-mcp
pm2 save

# Ou modifiez le .env du projet GTD et rebuild le MCP
cd ~/apps/2507-gtd-docker/mcp-server && npm run build && pm2 restart gtd-mcp && pm2 save`}
        </code>
      </div>
    </div>
  )
}
