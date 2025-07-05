import type { User } from '../types/auth'

interface HeaderProps {
  user: User | null
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className='bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center'>
            <h1 className='text-2xl font-bold text-blue-600'>🚀 GTD App</h1>
          </div>

          <nav className='flex items-center space-x-4'>
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
          </nav>
        </div>
      </div>
    </header>
  )
} 