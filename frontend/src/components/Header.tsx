import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import type { User } from '../types/auth'
import { cn } from '../utils/cn'

interface HeaderProps {
  user: User | null
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/tasks', label: 'Tâches', icon: '📋' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊' }
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className='bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center'>
            <Link to="/tasks" className='text-xl sm:text-2xl font-bold text-blue-600 hover:text-blue-700 flex-shrink-0'>
              🚀 GTD App
            </Link>

            {/* Desktop Navigation */}
            <nav className='hidden md:flex ml-8 space-x-1'>
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

          {/* Desktop User Info */}
          <div className='hidden md:flex items-center space-x-4'>
            <span className='text-gray-700 text-sm font-medium truncate max-w-[200px]'>
              {user?.email}
            </span>
            <button
              onClick={onLogout}
              className='border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap'
            >
              Déconnexion
            </button>
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <button
              onClick={toggleMobileMenu}
              className='p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              aria-label="Menu principal"
            >
              <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                {isMobileMenuOpen ? (
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                ) : (
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className='md:hidden border-t border-gray-200 pb-3 pt-4'>
            <div className='space-y-1'>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors',
                    location.pathname === link.to
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
            <div className='mt-4 pt-4 border-t border-gray-200'>
              <div className='px-3 py-2'>
                <span className='block text-sm font-medium text-gray-700 truncate'>
                  {user?.email}
                </span>
              </div>
              <button
                onClick={() => {
                  onLogout()
                  setIsMobileMenuOpen(false)
                }}
                className='mt-2 mx-3 w-[calc(100%-1.5rem)] border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors'
              >
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 