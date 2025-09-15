import { Navigate } from 'react-router-dom'
import { RegisterForm } from '../components/RegisterForm'
import { useIsAuthenticated } from '../hooks/useAuth'

export function RegisterPage() {
  const isAuthenticated = useIsAuthenticated()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/tasks" replace />
  }

  return <RegisterForm />
}