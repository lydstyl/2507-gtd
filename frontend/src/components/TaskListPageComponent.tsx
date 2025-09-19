import { useApp } from '../stores/AppContext'
import { Header } from './Header'
import { Footer } from './Footer'
import TaskListPage from './TaskListPage'
import { useCurrentUser, useLogout } from '../hooks/useAuth'

export function TaskListPageComponent() {
  const { state } = useApp()
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header user={user} onLogout={handleLogout} />
      <TaskListPage />
      <Footer />
    </div>
  )
}