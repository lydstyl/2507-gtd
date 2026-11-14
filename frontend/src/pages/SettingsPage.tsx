import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useIsAuthenticated, useCurrentUser, useLogout } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { ApiKeysSection } from '../components/ApiKeysSection'
import { applyTheme, getStoredTheme, type Theme } from '../utils/theme'

export function SettingsPage() {
  const isAuthenticated = useIsAuthenticated()
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    logout()
  }

  const handleThemeChange = (next: Theme) => {
    setTheme(next)
    applyTheme(next)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user || null} onLogout={handleLogout} />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Paramètres</h1>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🎨 Apparence</h2>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <p className="text-sm text-gray-600 mb-4">
              Mode sombre : fond nuit et textes clairs, confortable pour les yeux
              le soir sur le téléphone. Le choix est mémorisé sur cet appareil.
            </p>
            <div
              className="inline-flex rounded-lg border border-gray-300 overflow-hidden"
              role="radiogroup"
              aria-label="Thème de l'application"
            >
              <button
                type="button"
                role="radio"
                aria-checked={theme === 'light'}
                onClick={() => handleThemeChange('light')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                ☀️ Clair
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={theme === 'dark'}
                onClick={() => handleThemeChange('dark')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                🌙 Sombre
              </button>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🔑 Clés API</h2>
          <ApiKeysSection />
        </section>
      </main>
      <Footer />
    </div>
  )
}
