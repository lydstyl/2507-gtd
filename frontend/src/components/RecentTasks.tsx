import type { Task } from '../types/task'
import { TaskCard } from './TaskCard'

interface RecentTasksProps {
  tasks: Task[]
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
  onAssignParent?: (task: Task) => void
  onEditNote?: (task: Task) => void
  onMarkCompleted?: (taskId: string) => void
  onToggleCompleted?: (taskId: string, isCompleted: boolean) => void
}

export function RecentTasks({
  tasks,
  onEditTask,
  onDeleteTask,
  onCreateSubtask,
  onAssignParent,
  onEditNote,
  onMarkCompleted,
  onToggleCompleted
}: RecentTasksProps) {
  if (tasks.length === 0) return null

  // Filtrer pour n'afficher que les tâches principales (sans parent)
  const mainTasks = tasks.filter((task) => !task.parentId)

  if (mainTasks.length === 0) return null

  return (
    <div className='mt-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        Tâches récentes
      </h3>
      <div className='space-y-3'>
        {mainTasks.slice(0, 5).map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onCreateSubtask={onCreateSubtask}
            onAssignParent={onAssignParent}
            onEditNote={onEditNote}
            onMarkCompleted={onToggleCompleted ? (taskId) => onToggleCompleted(taskId, !task.isCompleted) : onMarkCompleted}
          />
        ))}
      </div>
    </div>
  )
}
