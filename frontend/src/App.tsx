import { useState, useEffect } from 'react'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { CreateTaskModal } from './components/CreateTaskModal'
import type { User } from './types/auth'
import type { Task } from './types/task'
import { api } from './utils/api'

type AuthView = 'login' | 'register' | 'dashboard'

function App() {
  const [authView, setAuthView] = useState<AuthView>('login')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const token = localStorage.getItem('token')
    if (token) {
      // TODO: Vérifier la validité du token avec l'API
      // Pour l'instant, on suppose qu'il est valide
      setUser({ id: 'user-id', email: 'user@example.com' })
      setAuthView('dashboard')
      loadTasks()
    }
    setIsLoading(false)
  }, [])

  const loadTasks = async () => {
    try {
      const tasksData = await api.getTasks()
      setTasks(tasksData)
    } catch (err) {
      console.error('Erreur lors du chargement des tâches:', err)
    }
  }

  const handleAuthSuccess = (token: string, userData: User) => {
    setUser(userData)
    setAuthView('dashboard')
    loadTasks()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setAuthView('login')
    setTasks([])
  }

  const handleTaskCreated = () => {
    loadTasks()
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (authView === 'login') {
    return (
      <LoginForm
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => setAuthView('register')}
      />
    )
  }

  if (authView === 'register') {
    return (
      <RegisterForm
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => setAuthView('login')}
      />
    )
  }

  const completedTasks = tasks.filter((task) => task.priority === 0) // Supposons que priority = 0 signifie terminé
  const activeTasks = tasks.filter((task) => task.priority > 0)

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
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
                  onClick={handleLogout}
                  className='border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                >
                  Déconnexion
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Tableau de bord
            </h2>
            <p className='text-gray-600 mb-8'>
              Bienvenue dans votre espace de travail GTD, {user?.email} !
            </p>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='bg-blue-50 rounded-lg p-6 text-center'>
                <div className='text-3xl font-bold text-blue-600 mb-2'>
                  {activeTasks.length}
                </div>
                <div className='text-sm font-medium text-gray-600'>
                  Tâches en cours
                </div>
              </div>

              <div className='bg-green-50 rounded-lg p-6 text-center'>
                <div className='text-3xl font-bold text-green-600 mb-2'>
                  {completedTasks.length}
                </div>
                <div className='text-sm font-medium text-gray-600'>
                  Tâches terminées
                </div>
              </div>

              <div className='bg-purple-50 rounded-lg p-6 text-center'>
                <div className='text-3xl font-bold text-purple-600 mb-2'>0</div>
                <div className='text-sm font-medium text-gray-600'>
                  Tags créés
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className='mt-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Actions rapides
              </h3>
              <div className='flex flex-wrap gap-4'>
                <button
                  onClick={() => setIsCreateTaskModalOpen(true)}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
                >
                  + Nouvelle tâche
                </button>
                <button className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'>
                  + Nouveau tag
                </button>
                <button className='border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition-colors'>
                  Voir toutes les tâches
                </button>
              </div>
            </div>

            {/* Recent Tasks */}
            {tasks.length > 0 && (
              <div className='mt-8'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Tâches récentes
                </h3>
                <div className='space-y-3'>
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50'
                    >
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            task.priority >= 4
                              ? 'bg-red-500'
                              : task.priority >= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        ></div>
                        <div>
                          <h4 className='font-medium text-gray-900'>
                            {task.name}
                          </h4>
                          <p className='text-sm text-gray-500'>
                            Priorité: {task.priority} | Importance:{' '}
                            {task.importance} | Urgence: {task.urgency}
                          </p>
                        </div>
                      </div>
                      {task.dueDate && (
                        <span className='text-sm text-gray-500'>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-gray-900 text-gray-400'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center'>
            <p className='text-sm'>
              &copy; 2025 GTD App. Construit avec React et Node.js.
            </p>
          </div>
        </div>
      </footer>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  )
}

export default App
