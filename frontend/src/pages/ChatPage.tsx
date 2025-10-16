import { Navigate } from 'react-router-dom'
import { useIsAuthenticated } from '../hooks/useAuth'
import { ChatInterface } from '../components/Chat/ChatInterface'

export function ChatPage() {
  const isAuthenticated = useIsAuthenticated()

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="h-screen flex flex-col">
      <ChatInterface />
    </div>
  )
}
