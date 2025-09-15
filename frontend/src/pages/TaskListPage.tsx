import { Navigate } from 'react-router-dom'
import { useIsAuthenticated } from '../hooks/useAuth'
import { TaskListPageComponent } from '../components/TaskListPageComponent'

export function TaskListPage() {
  const isAuthenticated = useIsAuthenticated()

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <TaskListPageComponent />
}