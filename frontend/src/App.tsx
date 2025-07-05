import { useState, useEffect } from 'react'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { CreateTaskModal } from './components/CreateTaskModal'
import { CreateTagModal } from './components/CreateTagModal'
import { EditTaskModal } from './components/EditTaskModal'
import { TagManagerModal } from './components/TagManagerModal'
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
  const [isTagManagerModalOpen, setIsTagManagerModalOpen] = useState(false)
  const [createTaskParentId, setCreateTaskParentId] = useState<string | undefined>(undefined)

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
      console.log('🔄 Chargement des tâches...')
      const tasksData = await api.getTasks()
      console.log('📋 Tâches reçues:', tasksData.length)
      console.log('📋 Détail des tâches:', tasksData.map(t => ({ name: t.name, parentId: t.parentId, subtasks: t.subtasks.length })))
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

  const handleTaskCreated = async () => {
    console.log('✅ Tâche créée, rechargement...')
    // Petit délai pour s'assurer que le backend a traité la création
    await new Promise(resolve => setTimeout(resolve, 500))
    loadTasks()
  }

  const handleTaskUpdated = () => {
    loadTasks()
  }

  const handleTaskDeleted = async (taskId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await api.deleteTask(taskId)
        loadTasks()
      } catch (err) {
        console.error('Erreur lors de la suppression de la tâche:', err)
        alert('Erreur lors de la suppression de la tâche')
      }
    }
  }

  const handleTagCreated = () => {
    // Optionnel : recharger les tags si nécessaire
    console.log('Tag créé avec succès')
  }

  const handleCreateTask = () => {
    setCreateTaskParentId(undefined)
    setIsCreateTaskModalOpen(true)
  }

  const handleCreateSubtask = (parentId: string) => {
    setCreateTaskParentId(parentId)
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

  const handleCloseCreateTaskModal = () => {
    setIsCreateTaskModalOpen(false)
    setCreateTaskParentId(undefined)
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
        onManageTags={() => setIsTagManagerModalOpen(true)}
        onEditTask={handleEditTask}
        onDeleteTask={handleTaskDeleted}
        onCreateSubtask={handleCreateSubtask}
      />

      <Footer />

              <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={handleCloseCreateTaskModal}
          onTaskCreated={handleTaskCreated}
          parentId={createTaskParentId}
        />

      <CreateTagModal
        isOpen={isCreateTagModalOpen}
        onClose={() => setIsCreateTagModalOpen(false)}
        onTagCreated={handleTagCreated}
      />

      <TagManagerModal
        isOpen={isTagManagerModalOpen}
        onClose={() => setIsTagManagerModalOpen(false)}
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
