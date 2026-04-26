import { Navigate } from 'react-router-dom'
import { useIsAuthenticated, useCurrentUser, useLogout } from '../hooks/useAuth'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import SomedayMaybeList from '../components/SomedayMaybeList'

export function SomedayMaybePage() {
  const isAuthenticated = useIsAuthenticated()
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header user={user ?? null} onLogout={logout} />
      <SomedayMaybeList />
      <Footer />
    </div>
  )
}
