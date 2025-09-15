import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'
import { useIsAuthenticated } from '../hooks/useAuth'

export function LoginPage() {
  const isAuthenticated = useIsAuthenticated()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/tasks" replace />
  }

  return <LoginForm />
}