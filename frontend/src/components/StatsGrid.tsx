interface StatsGridProps {
  activeTasksCount: number
  completedTasksCount: number
  tagsCount: number
}

export function StatsGrid({ activeTasksCount, completedTasksCount, tagsCount }: StatsGridProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='bg-blue-50 rounded-lg p-6 text-center'>
        <div className='text-3xl font-bold text-blue-600 mb-2'>
          {activeTasksCount}
        </div>
        <div className='text-sm font-medium text-gray-600'>
          Tâches en cours
        </div>
      </div>

      <div className='bg-green-50 rounded-lg p-6 text-center'>
        <div className='text-3xl font-bold text-green-600 mb-2'>
          {completedTasksCount}
        </div>
        <div className='text-sm font-medium text-gray-600'>
          Tâches terminées
        </div>
      </div>

      <div className='bg-purple-50 rounded-lg p-6 text-center'>
        <div className='text-3xl font-bold text-purple-600 mb-2'>{tagsCount}</div>
        <div className='text-sm font-medium text-gray-600'>
          Tags créés
        </div>
      </div>
    </div>
  )
} 