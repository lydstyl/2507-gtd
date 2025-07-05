import type { Task } from '../types/task'
import { TaskCard } from './TaskCard'

interface RecentTasksProps {
  tasks: Task[]
  onEditTask?: (task: Task) => void
}

export function RecentTasks({ tasks, onEditTask }: RecentTasksProps) {
  if (tasks.length === 0) return null

  return (
    <div className='mt-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        Tâches récentes
      </h3>
      <div className='space-y-3'>
        {tasks.slice(0, 5).map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEditTask} />
        ))}
      </div>
    </div>
  )
} 