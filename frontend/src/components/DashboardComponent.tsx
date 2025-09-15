import { useApp } from '../stores/AppContext'
import { Header } from './Header'
import { Footer } from './Footer'
import { Dashboard } from './Dashboard'
import { useCurrentUser, useLogout } from '../hooks/useAuth'
import { useAllTasks } from '../hooks/useTasks'

export function DashboardComponent() {
  const { state, dispatch } = useApp()
  const { data: user } = useCurrentUser()
  const { data: tasks = [] } = useAllTasks()
  const logoutMutation = useLogout()

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  const handleCreateTask = () => {
    dispatch({
      type: 'OPEN_MODAL',
      payload: { modal: 'createTask' }
    })
  }

  const handleCreateTag = () => {
    dispatch({
      type: 'OPEN_MODAL',
      payload: { modal: 'createTag' }
    })
  }

  const handleManageTags = () => {
    dispatch({
      type: 'OPEN_MODAL',
      payload: { modal: 'tagManager' }
    })
  }

  const handleViewAllTasks = () => {
    // Navigate to tasks page - this should be handled by router
    window.location.pathname = '/tasks'
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header user={user} onLogout={handleLogout} />
      <Dashboard
        user={user}
        tasks={tasks}
        onCreateTask={handleCreateTask}
        onCreateTag={handleCreateTag}
        onManageTags={handleManageTags}
        onViewAllTasks={handleViewAllTasks}
        onEditTask={(task) => {
          dispatch({
            type: 'OPEN_MODAL',
            payload: { modal: 'editTask', data: { taskId: task.id } }
          })
        }}
        onDeleteTask={() => {}}
        onCreateSubtask={(parentId) => {
          dispatch({
            type: 'OPEN_MODAL',
            payload: { modal: 'createTask', data: { parentId } }
          })
        }}
        onAssignParent={() => {}}
        onEditNote={(task) => {
          dispatch({
            type: 'OPEN_MODAL',
            payload: { modal: 'note', data: { taskId: task.id } }
          })
        }}
        onRefreshTasks={() => {}}
      />
      <Footer />
    </div>
  )
}