import { useEffect, useState } from 'react'
import { SwipeableTaskCard } from './SwipeableTaskCard'
import { EditTaskModal } from './EditTaskModal'
import type { Task } from '../types/task'
import { api } from '../utils/api'

export default function SomedayMaybeList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const loadTasks = async () => {
    try {
      const tasksData = await api.getRootTasks()
      setTasks(tasksData.filter((t: Task) => t.status === 'un_jour_peut_etre'))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const handleTaskUpdated = () => {
    loadTasks()
    setEditingTask(null)
  }

  const handleTaskDeleted = async (taskId: string) => {
    try {
      await api.deleteTask(taskId)
      loadTasks()
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }

  const handleMarkCompleted = async (taskId: string) => {
    try {
      await api.markTaskCompleted(taskId)
      loadTasks()
    } catch (err) {
      console.error('Error marking task as completed:', err)
    }
  }

  if (loading) {
    return (
      <main className='max-w-4xl mx-auto px-4 py-6'>
        <div className='text-center text-gray-500 py-12'>Chargement...</div>
      </main>
    )
  }

  return (
    <main className='max-w-4xl mx-auto px-4 py-6'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Un jour peut-être</h1>
          <p className='text-sm text-gray-500 mt-1'>
            {tasks.length} tâche{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4'>
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className='text-gray-500 text-center py-12'>
          <div className='text-4xl mb-4'>🌙</div>
          <p>Aucune tâche "un jour peut-être".</p>
          <p className='text-sm mt-2'>
            Changez le statut d'une tâche en "Un jour peut-être" pour la voir ici.
          </p>
        </div>
      ) : (
        <div className='space-y-0'>
          {tasks.map((task) => (
            <SwipeableTaskCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onSelectTask={(taskId) => setSelectedTaskId(taskId === selectedTaskId ? null : taskId)}
              onEdit={() => setEditingTask(task)}
              onDelete={() => handleTaskDeleted(task.id)}
              onMarkCompleted={() => handleMarkCompleted(task.id)}
            />
          ))}
        </div>
      )}

      <EditTaskModal
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={handleTaskUpdated}
        task={editingTask}
      />
    </main>
  )
}
