import { Navigate } from 'react-router-dom'
import { useIsAuthenticated } from '../hooks/useAuth'
import { DashboardComponent } from '../components/DashboardComponent'

export function DashboardPage() {
  const isAuthenticated = useIsAuthenticated()

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <DashboardComponent />
}