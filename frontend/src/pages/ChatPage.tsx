import { Navigate } from 'react-router-dom'
import { useIsAuthenticated, useCurrentUser, useLogout } from '../hooks/useAuth'
import { ChatInterface } from '../components/Chat/ChatInterface'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export function ChatPage() {
  const isAuthenticated = useIsAuthenticated()
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user || null} onLogout={handleLogout} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-[calc(100vh-200px)]">
          <ChatInterface />
        </div>
      </main>
      <Footer />
    </div>
  )
}
