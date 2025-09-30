import React from 'react'
import { SwipeableTaskCard } from './SwipeableTaskCard'
import type { Task } from '../types/task'
import { api } from '../utils/api'

interface PinnedTaskSectionProps {
  pinnedTaskId: string | null
  focusTaskId: string | null
  tasks: Task[]
  selectedTaskId: string | null
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => Promise<void>
  onCreateSubtask: (parentId: string) => void
  onAssignParent: (task: Task) => void
  onEditNote: (task: Task) => void
  onMarkCompleted: (taskId: string) => Promise<void>
  onWorkedOn: (taskId: string) => Promise<void>
  onReorderSubtasks?: (taskId: string, newPosition: number) => Promise<void>
  onSelectTask: (taskId: string) => void
  onQuickAction: (taskId: string, action: string) => Promise<void>
  onTaskUpdated: () => void
  setError: (error: string) => void
  pinnedRef: React.RefObject<HTMLDivElement | null>
  onPin: (taskId: string) => void
}

export function PinnedTaskSection({
  pinnedTaskId,
  focusTaskId,
  tasks,
  selectedTaskId,
  onEdit,
  onDelete,
  onCreateSubtask,
  onAssignParent,
  onEditNote,
  onMarkCompleted,
  onWorkedOn,
  onReorderSubtasks,
  onSelectTask,
  onQuickAction,
  onTaskUpdated,
  setError,
  pinnedRef,
  onPin
}: PinnedTaskSectionProps) {
  if (!pinnedTaskId || focusTaskId) return null

  const pinnedTask = tasks.find((t) => t.id === pinnedTaskId)
  if (!pinnedTask) return null

  return (
    <div
      className='mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg'
      ref={pinnedRef}
    >
      <div className='mb-2 text-yellow-800 font-semibold'>
        Tâche fixée en haut de la liste
      </div>
      <SwipeableTaskCard
        task={pinnedTask}
        isSelected={selectedTaskId === pinnedTaskId}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateSubtask={onCreateSubtask}
        onAssignParent={onAssignParent}
        onEditNote={onEditNote}
        onMarkCompleted={onMarkCompleted}
        onWorkedOn={onWorkedOn}
        onReorderSubtasks={onReorderSubtasks}
        onSelectTask={onSelectTask}
        selectedTaskId={selectedTaskId ?? undefined}
        onQuickAction={onQuickAction}
        onPin={onPin}
        isPinned={true}
      />

      {/* Quick action buttons for pinned task */}
      <div className='mt-3 pt-3 border-t border-yellow-300'>
        <div className='flex flex-col space-y-3'>
          {/* Importance buttons */}
          <div>
            <label className='block text-xs font-medium text-yellow-800 mb-1'>
              Importance
            </label>
            <div className='flex flex-wrap gap-1'>
              {[
                { value: 50, label: 'Très élevée' },
                { value: 40, label: 'Élevée' },
                { value: 30, label: 'Moyenne' },
                { value: 20, label: 'Basse' },
                { value: 10, label: 'Très basse' },
                { value: 0, label: 'Nulle' }
              ].map(({ value, label }) => {
                const isActive = pinnedTask.importance === value
                return (
                  <button
                    key={value}
                    onClick={async () => {
                      try {
                         await api.updateTask(pinnedTaskId, {
                           importance: value
                         })
                         onTaskUpdated()
                       } catch (err: unknown) {
                         setError(err instanceof Error ? err.message : 'An error occurred')
                      }
                    }}
                    className={`px-2 py-1 text-xs rounded border ${
                      isActive
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Complexity buttons */}
          <div>
            <label className='block text-xs font-medium text-yellow-800 mb-1'>
              Complexité
            </label>
            <div className='flex flex-wrap gap-1'>
              {[
                { value: 1, label: 'Simple' },
                { value: 3, label: 'Facile' },
                { value: 5, label: 'Moyenne' },
                { value: 7, label: 'Difficile' },
                { value: 9, label: 'Très complexe' }
              ].map(({ value, label }) => {
                const isActive = pinnedTask.complexity === value
                return (
                  <button
                    key={value}
                    onClick={async () => {
                      try {
                         await api.updateTask(pinnedTaskId, {
                           complexity: value
                         })
                         onTaskUpdated()
                       } catch (err: unknown) {
                         setError(err instanceof Error ? err.message : 'An error occurred')
                      }
                    }}
                    className={`px-2 py-1 text-xs rounded border ${
                      isActive
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
