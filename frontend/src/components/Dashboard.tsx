import type { User } from '../types/auth'
import type { Task } from '../types/task'
import { StatsGrid } from './StatsGrid'
import { QuickActions } from './QuickActions'
import { RecentTasks } from './RecentTasks'
import { CSVImportExport } from './CSVImportExport'
import { CompletionStats } from './CompletionStats'
import { useState } from 'react'
import { api } from '../utils/api'
import { useTags } from '../hooks/useTags'

interface DashboardProps {
  user: User | null
  tasks: Task[]
  onCreateTag: () => void
  onManageTags: () => void
  onViewAllTasks: () => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
  onAssignParent?: (task: Task) => void
  onEditNote?: (task: Task) => void
  onMarkCompleted?: (taskId: string) => void
  onRefreshTasks?: () => void
}

export function Dashboard({
  user,
  tasks,
  onCreateTag,
  onManageTags,
  onViewAllTasks,
  onEditTask,
  onDeleteTask,
  onCreateSubtask,
  onAssignParent,
  onEditNote,
  onMarkCompleted,
  onRefreshTasks
}: DashboardProps) {
  const completedTasks = tasks.filter((task) => task.isCompleted)
  const activeTasks = tasks.filter((task) => !task.isCompleted)
  const [deleting, setDeleting] = useState(false)
  const { data: tags = [] } = useTags()

  const handleDeleteAllTasks = async () => {
    if (
      !window.confirm(
        'Voulez-vous vraiment supprimer TOUTES vos tâches ? Cette action est irréversible.'
      )
    )
      return
    setDeleting(true)
    try {
      await api.deleteAllTasks()
      if (onRefreshTasks) onRefreshTasks()
     } catch {
       alert('Erreur lors de la suppression des tâches.')
     } finally {
      setDeleting(false)
    }
  }

  const handleToggleCompleted = async (taskId: string, isCompleted: boolean) => {
    try {
      if (isCompleted) {
        await api.markTaskCompleted(taskId)
      } else {
        await api.updateTask(taskId, { isCompleted: false })
      }
      if (onRefreshTasks) onRefreshTasks()
     } catch {
       alert('Erreur lors de la modification du statut de la tâche.')
     }
  }

  return (
    <main className='flex-1'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Tableau de bord
          </h2>
          <p className='text-gray-600 mb-8'>
            Bienvenue dans votre espace de travail GTD, {user?.email} !
          </p>

          <StatsGrid
            activeTasksCount={activeTasks.length}
            completedTasksCount={completedTasks.length}
            tagsCount={tags.length}
          />

          <QuickActions
            onCreateTag={onCreateTag}
            onManageTags={onManageTags}
            onViewAllTasks={onViewAllTasks}
          />

          <RecentTasks
            tasks={tasks}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onCreateSubtask={onCreateSubtask}
            onAssignParent={onAssignParent}
            onEditNote={onEditNote}
            onMarkCompleted={onMarkCompleted}
            onToggleCompleted={handleToggleCompleted}
          />

          <div className='mt-8'>
            <CompletionStats />
          </div>

          <div className='mt-8 flex flex-col gap-4'>
            <CSVImportExport onImportSuccess={onRefreshTasks || (() => {})} />
            <button
              className='bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow disabled:opacity-60'
              onClick={handleDeleteAllTasks}
              disabled={deleting}
            >
              {deleting
                ? 'Suppression en cours...'
                : 'Supprimer toutes mes tâches'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
