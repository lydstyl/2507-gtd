import { useState, useEffect } from 'react'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { CreateTaskModal } from './components/CreateTaskModal'
import { CreateTagModal } from './components/CreateTagModal'
import { EditTaskModal } from './components/EditTaskModal'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { Footer } from './components/Footer'
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
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false)
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

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

  const handleTaskUpdated = () => {
    loadTasks()
  }

  const handleTagCreated = () => {
    // Optionnel : recharger les tags si nécessaire
    console.log('Tag créé avec succès')
  }

  const handleCreateTask = () => {
    setIsCreateTaskModalOpen(true)
  }

  const handleCreateTag = () => {
    setIsCreateTagModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsEditTaskModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditTaskModalOpen(false)
    setEditingTask(null)
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

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header user={user} onLogout={handleLogout} />
      
      <Dashboard 
        user={user} 
        tasks={tasks} 
        onCreateTask={handleCreateTask}
        onCreateTag={handleCreateTag}
        onEditTask={handleEditTask}
      />

      <Footer />

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      <CreateTagModal
        isOpen={isCreateTagModalOpen}
        onClose={() => setIsCreateTagModalOpen(false)}
        onTagCreated={handleTagCreated}
      />

      <EditTaskModal
        isOpen={isEditTaskModalOpen}
        onClose={handleCloseEditModal}
        onTaskUpdated={handleTaskUpdated}
        task={editingTask}
      />
    </div>
  )
}

export default App
