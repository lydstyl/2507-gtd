import { Link, useLocation } from 'react-router-dom'
import type { User } from '../types/auth'
import { cn } from '../utils/cn'

interface HeaderProps {
  user: User | null
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const location = useLocation()

  const navLinks = [
    { to: '/tasks', label: 'Tâches', icon: '📋' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊' }
  ]

  return (
    <header className='bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center space-x-8'>
            <Link to="/tasks" className='text-2xl font-bold text-blue-600 hover:text-blue-700'>
              🚀 GTD App
            </Link>

            <nav className='flex space-x-1'>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1',
                    location.pathname === link.to
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className='flex items-center space-x-4'>
            <span className='text-gray-700 text-sm font-medium'>
              {user?.email}
            </span>
            <button
              onClick={onLogout}
              className='border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors'
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  )
} 