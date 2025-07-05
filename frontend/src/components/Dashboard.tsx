import type { User } from '../types/auth'
import type { Task } from '../types/task'
import { StatsGrid } from './StatsGrid'
import { QuickActions } from './QuickActions'
import { RecentTasks } from './RecentTasks'

interface DashboardProps {
  user: User | null
  tasks: Task[]
  onCreateTask: () => void
  onCreateTag: () => void
  onManageTags: () => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
}

export function Dashboard({ user, tasks, onCreateTask, onCreateTag, onManageTags, onEditTask, onDeleteTask, onCreateSubtask }: DashboardProps) {
  const completedTasks = tasks.filter((task) => task.priority === 0)
  const activeTasks = tasks.filter((task) => task.priority > 0)

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
            tagsCount={0}
          />

          <QuickActions onCreateTask={onCreateTask} onCreateTag={onCreateTag} onManageTags={onManageTags} />

          <RecentTasks 
            tasks={tasks} 
            onEditTask={onEditTask} 
            onDeleteTask={onDeleteTask}
            onCreateSubtask={onCreateSubtask}
          />
        </div>
      </div>
    </main>
  )
} 