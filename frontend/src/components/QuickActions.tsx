interface QuickActionsProps {
  onCreateTask: () => void
  onCreateTag: () => void
  onManageTags: () => void
  onViewAllTasks: () => void
}

export function QuickActions({ onCreateTask, onCreateTag, onManageTags, onViewAllTasks }: QuickActionsProps) {
  return (
    <div className='mt-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        Actions rapides
      </h3>
      <div className='flex flex-wrap gap-4'>
        <button
          onClick={onCreateTask}
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
        >
          + Nouvelle tâche
        </button>
        <button 
          onClick={onCreateTag}
          className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
        >
          + Nouveau tag
        </button>
        <button
          onClick={onManageTags}
          className='border border-purple-500 text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-md text-sm font-medium transition-colors'
        >
          Gérer les tags
        </button>
        <button 
          onClick={onViewAllTasks}
          className='border border-blue-300 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors'
        >
          Retour aux tâches
        </button>
      </div>
    </div>
  )
} 