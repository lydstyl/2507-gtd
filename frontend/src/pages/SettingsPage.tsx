import { Navigate } from 'react-router-dom'
import { useIsAuthenticated, useCurrentUser, useLogout } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { ApiKeysSection } from '../components/ApiKeysSection'

export function SettingsPage() {
  const isAuthenticated = useIsAuthenticated()
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user || null} onLogout={handleLogout} />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Paramètres</h1>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🔑 Clés API</h2>
          <ApiKeysSection />
        </section>
      </main>
      <Footer />
    </div>
  )
}
