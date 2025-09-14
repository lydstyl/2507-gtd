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
import TaskListPage from './components/TaskListPage'
import { NoteModal } from './components/NoteModal'

type AuthView = 'login' | 'register' | 'dashboard' | 'tasklist'

function App() {
  const [authView, setAuthView] = useState<AuthView>('login')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false)
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingNoteTask, setEditingNoteTask] = useState<Task | null>(null)
  const [isTagManagerModalOpen, setIsTagManagerModalOpen] = useState(false)
  const [createTaskParentId, setCreateTaskParentId] = useState<
    string | undefined
  >(undefined)

  // Ajout d'un état pour afficher la page de liste complète
  // const [showTaskList, setShowTaskList] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const token = localStorage.getItem('token')
    if (token) {
      try {
        // Décoder le token JWT pour récupérer les informations de l'utilisateur
        const payload = JSON.parse(atob(token.split('.')[1]))
        const userData = {
          id: payload.userId,
          email: payload.email
        }
        setUser(userData)
        setAuthView('tasklist')
        loadTasks()
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error)
        // Si le token est invalide, on le supprime et on redirige vers la connexion
        localStorage.removeItem('token')
        setAuthView('login')
      }
    }
    setIsLoading(false)
  }, [])

  const loadTasks = async () => {
    try {
      console.log('🔄 Chargement des tâches...')
      const tasksData = await api.getTasks()
      console.log('📋 Tâches reçues:', tasksData.length)
      console.log(
        '📋 Détail des tâches:',
        tasksData.map((t) => ({
          name: t.name,
          parentId: t.parentId,
          subtasks: t.subtasks.length
        }))
      )
      setTasks(tasksData)
    } catch (err) {
      console.error('Erreur lors du chargement des tâches:', err)
    }
  }

  const loadAllTasks = async () => {
    try {
      console.log('🔄 Chargement de toutes les tâches (y compris sous-tâches)...')
      const tasksData = await api.getAllTasks()
      console.log('📋 Toutes les tâches reçues:', tasksData.length)
      console.log(
        '📋 Détail des tâches:',
        tasksData.map((t) => ({
          name: t.name,
          parentId: t.parentId,
          subtasks: t.subtasks.length
        }))
      )
      setTasks(tasksData)
    } catch (err) {
      console.error('Erreur lors du chargement des tâches:', err)
    }
  }

  const handleAuthSuccess = (_token: string, userData: User) => {
    setUser(userData)
    setAuthView('tasklist')
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
    await new Promise((resolve) => setTimeout(resolve, 500))
    loadTasks()
  }

  const handleTaskCreatedForDashboard = async () => {
    console.log('✅ Tâche créée, rechargement pour Dashboard...')
    // Petit délai pour s'assurer que le backend a traité la création
    await new Promise((resolve) => setTimeout(resolve, 500))
    loadAllTasks()
  }

  const handleTaskUpdated = () => {
    loadTasks()
  }

  const handleTaskUpdatedForDashboard = () => {
    loadAllTasks()
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

  const handleTaskDeletedForDashboard = async (taskId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await api.deleteTask(taskId)
        loadAllTasks()
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

  const handleAssignParent = () => {
    // Pour le dashboard, on peut rediriger vers la page de liste complète
    // où le modal d'assignation de parent est disponible
    setAuthView('tasklist')
  }

  const handleEditNote = (task: Task) => {
    setEditingNoteTask(task)
    setIsNoteModalOpen(true)
  }

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false)
    setEditingNoteTask(null)
  }

  const handleSaveNote = async (taskId: string, note: string) => {
    try {
      await api.updateTaskNote(taskId, note)
      loadTasks()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la note:', err)
      alert('Erreur lors de la sauvegarde de la note')
    }
  }

  const handleDeleteNote = async (taskId: string) => {
    try {
      await api.deleteTaskNote(taskId)
      loadTasks()
    } catch (err) {
      console.error('Erreur lors de la suppression de la note:', err)
      alert('Erreur lors de la suppression de la note')
    }
  }

  const handleCloseEditModal = () => {
    setIsEditTaskModalOpen(false)
    setEditingTask(null)
  }

  const handleCloseCreateTaskModal = () => {
    setIsCreateTaskModalOpen(false)
    setCreateTaskParentId(undefined)
  }

  // Déterminer les fonctions appropriées selon le contexte
  const taskCreatedHandler = authView === 'tasklist' ? handleTaskCreated : handleTaskCreatedForDashboard
  const taskUpdatedHandler = authView === 'tasklist' ? handleTaskUpdated : handleTaskUpdatedForDashboard

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

  // Affichage de la page de liste complète
  if (authView === 'tasklist') {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Header user={user} onLogout={handleLogout} />
        <TaskListPage />
        <Footer />
        <button
          className='fixed bottom-8 right-8 bg-green-600 text-white px-4 py-2 rounded shadow-lg hover:bg-green-700'
          onClick={() => setAuthView('dashboard')}
        >
          Dashboard
        </button>
      </div>
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
        onViewAllTasks={() => setAuthView('tasklist')}
        onEditTask={handleEditTask}
        onDeleteTask={handleTaskDeletedForDashboard}
        onCreateSubtask={handleCreateSubtask}
        onAssignParent={handleAssignParent}
        onEditNote={handleEditNote}
        onRefreshTasks={loadAllTasks}
      />
      <Footer />

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={handleCloseCreateTaskModal}
        onTaskCreated={taskCreatedHandler}
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
        onTaskUpdated={taskUpdatedHandler}
        task={editingTask}
      />

      {editingNoteTask && (
        <NoteModal
          isOpen={isNoteModalOpen}
          onClose={handleCloseNoteModal}
          task={editingNoteTask}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
        />
      )}
    </div>
  )
}

export default App
