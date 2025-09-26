import { useEffect, useState, useRef } from 'react'
import { TaskCard } from './TaskCard'
import { CreateTaskModal } from './CreateTaskModal'
import { EditTaskModal } from './EditTaskModal'
import { AssignParentModal } from './AssignParentModal'
import { NoteModal } from './NoteModal'
import { TaskFilters } from './TaskFilters'
import { ShortcutsHelp } from './ShortcutsHelp'
import { PinnedTaskSection } from './PinnedTaskSection'
import type { Task, Tag } from '../types/task'
import { api } from '../utils/api'
import { useTaskFilters } from '../hooks/useTaskFilters'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useModalState } from '../hooks/useModalState'

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)
  const [pinnedTaskId, setPinnedTaskId] = useState<string | null>(null)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const pinnedRef = useRef<HTMLDivElement>(null)

  // Custom hooks
  const filterHook = useTaskFilters(tasks)
  const modalHook = useModalState()

  const loadTasks = async () => {
    try {
      const tasksData = await api.getRootTasks()
      setTasks(tasksData)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const loadTags = async () => {
    try {
      const tagsData = await api.getTags()
      setTags(tagsData)
    } catch (err: any) {
      console.error('Erreur lors du chargement des tags:', err)
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadTasks(), loadTags()]).finally(() => setLoading(false))
  }, [])

  const handleTaskCreated = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    loadTasks()
  }

  const handleTaskUpdated = () => {
    loadTasks()
  }

  // Apply filters function for keyboard shortcuts
  const applyFilters = (tasksToFilter: Task[]) => {
    // Don't filter out completed tasks anymore to allow toggling
    return tasksToFilter
  }

  const handleTaskDeleted = async (taskId: string) => {
    try {
      await api.deleteTask(taskId)
      loadTasks()
    } catch (err) {
      console.error('Erreur lors de la suppression de la tâche:', err)
      alert('Erreur lors de la suppression de la tâche')
    }
  }

  // Check if selected task still exists after reload
  useEffect(() => {
    if (selectedTaskId && !findTaskById(filterHook.filteredTasks, selectedTaskId)) {
      setSelectedTaskId(null)
    }
  }, [filterHook.filteredTasks, selectedTaskId])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    filteredTasks: filterHook.filteredTasks,
    selectedTaskId,
    setSelectedTaskId,
    tasks,
    tags,
    isModalOpen: modalHook.isAnyModalOpen,
    onTaskDeleted: handleTaskDeleted,
    onTasksReload: loadTasks,
    setPinnedTaskId,
    setShowShortcutsHelp,
    setFocusTaskId,
    applyFilters
  })

  // Scroll to top when pinning a task
  useEffect(() => {
    if (pinnedTaskId && pinnedRef.current) {
      pinnedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [pinnedTaskId])

  // Click selection
  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
  }

  const handlePin = (taskId: string) => {
    setPinnedTaskId(prev => prev === taskId ? null : taskId)
  }

  // Mobile quick actions handler
  const handleQuickAction = async (taskId: string, action: string) => {
    const task = findTaskById(tasks, taskId)
    if (!task) return

    let update: any = {}
    let shouldDelete = false

    switch (action) {
      case 'importance-up':
        update.importance = Math.min(50, task.importance + 10)
        break
      case 'importance-down':
        update.importance = Math.max(0, task.importance - 10)
        break
      case 'complexity-up':
        update.complexity = Math.min(9, task.complexity + 2)
        break
      case 'complexity-down':
        update.complexity = Math.max(1, task.complexity - 2)
        break
      case 'date-today':
        const today = new Date()
        update.plannedDate = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0')
        break
      case 'date-remove':
        update.plannedDate = null
        break
      case 'delete':
        shouldDelete = true
        break
    }

    try {
      if (shouldDelete) {
        await handleTaskDeleted(taskId)
      } else {
        await api.updateTask(taskId, update)
        await loadTasks()
      }
    } catch (err) {
      alert("Erreur lors de l'action rapide")
    }
  }

  const handleMarkCompleted = async (taskId: string) => {
    const task = findTaskById(tasks, taskId)
    if (!task) return

    try {
      if (task.isCompleted) {
        await api.updateTask(taskId, { isCompleted: false })
      } else {
        await api.markTaskCompleted(taskId)
      }
      loadTasks()
    } catch (err) {
      console.error('Erreur lors de la modification du statut de la tâche:', err)
      alert('Erreur lors de la modification du statut de la tâche')
    }
  }

  const handleWorkedOn = async (taskId: string) => {
    const task = findTaskById(tasks, taskId)
    if (!task) return

    try {
      await api.workedOnTask(taskId)
      loadTasks()
    } catch (err) {
      console.error('Erreur lors de la création de la tâche "travaillé dessus":', err)
      alert('Erreur lors de la création de la tâche "travaillé dessus"')
    }
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

  if (loading) return <div className='p-8 text-center'>Chargement…</div>
  if (error) return <div className='p-8 text-red-500'>{error}</div>

  return (
    <div className='w-full p-4'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Toutes les tâches</h1>
        <button
          onClick={modalHook.handleCreateTask}
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
        >
          + Nouvelle tâche
        </button>
      </div>

      <ShortcutsHelp
        showShortcutsHelp={showShortcutsHelp}
        setShowShortcutsHelp={setShowShortcutsHelp}
        tags={tags}
        pinnedTaskId={pinnedTaskId}
      />

      <PinnedTaskSection
        pinnedTaskId={pinnedTaskId}
        focusTaskId={focusTaskId}
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        onEdit={modalHook.handleEditTask}
        onDelete={handleTaskDeleted}
        onCreateSubtask={modalHook.handleCreateSubtask}
        onAssignParent={modalHook.handleAssignParent}
        onEditNote={modalHook.handleEditNote}
        onMarkCompleted={handleMarkCompleted}
        onWorkedOn={handleWorkedOn}
        onSelectTask={handleSelectTask}
        onQuickAction={handleQuickAction}
        onTaskUpdated={handleTaskUpdated}
        setError={setError}
        pinnedRef={pinnedRef}
        onPin={handlePin}
      />

      <TaskFilters
        searchTerm={filterHook.searchTerm}
        setSearchTerm={filterHook.setSearchTerm}
        importanceFilter={filterHook.importanceFilter}
        setImportanceFilter={filterHook.setImportanceFilter}
        importanceFilterType={filterHook.importanceFilterType}
        setImportanceFilterType={filterHook.setImportanceFilterType}
        complexityFilter={filterHook.complexityFilter}
        setComplexityFilter={filterHook.setComplexityFilter}
        complexityFilterType={filterHook.complexityFilterType}
        setComplexityFilterType={filterHook.setComplexityFilterType}
        tagFilter={filterHook.tagFilter}
        setTagFilter={filterHook.setTagFilter}
        dateFilter={filterHook.dateFilter}
        setDateFilter={filterHook.setDateFilter}
        tags={tags}
        clearAllFilters={filterHook.clearAllFilters}
        hasActiveFilters={filterHook.hasActiveFilters}
        filteredTasksCount={filterHook.filteredTasks.length}
        totalTasksCount={tasks.length}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      {tasks.length === 0 ? (
        <div className='text-gray-500 text-center py-8'>
          Aucune tâche trouvée.
          <br />
          <button
            onClick={modalHook.handleCreateTask}
            className='text-blue-600 hover:text-blue-800 underline mt-2'
          >
            Créer votre première tâche
          </button>
        </div>
      ) : filterHook.filteredTasks.length === 0 && filterHook.hasActiveFilters ? (
        <div className='text-gray-500 text-center py-8'>
          Aucune tâche ne correspond aux filtres sélectionnés.
          <br />
          <button
            onClick={filterHook.clearAllFilters}
            className='text-blue-600 hover:text-blue-800 underline mt-2'
          >
            Effacer les filtres
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-4'>
          {filterHook.filteredTasks
            .filter(task => !pinnedTaskId || task.id !== pinnedTaskId)
            .map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                level={0}
                onEdit={modalHook.handleEditTask}
                onDelete={handleTaskDeleted}
                onCreateSubtask={modalHook.handleCreateSubtask}
                onAssignParent={modalHook.handleAssignParent}
                onEditNote={modalHook.handleEditNote}
                onMarkCompleted={handleMarkCompleted}
                onWorkedOn={handleWorkedOn}
                isEven={index % 2 === 1}
                onSelectTask={handleSelectTask}
                selectedTaskId={selectedTaskId ?? undefined}
                onQuickAction={handleQuickAction}
                onPin={handlePin}
                isPinned={pinnedTaskId === task.id}
              />
            ))}
        </div>
      )}

      {focusTaskId && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="mb-2 text-yellow-800 font-semibold">
            Tâche modifiée hors de la vue filtrée
          </div>
          <TaskCard
            task={tasks.find((t) => t.id === focusTaskId)!}
            isSelected={true}
            onEdit={modalHook.handleEditTask}
            onDelete={handleTaskDeleted}
            onCreateSubtask={modalHook.handleCreateSubtask}
            onAssignParent={modalHook.handleAssignParent}
            onEditNote={modalHook.handleEditNote}
            onMarkCompleted={handleMarkCompleted}
            onWorkedOn={handleWorkedOn}
            onSelectTask={handleSelectTask}
            selectedTaskId={selectedTaskId ?? undefined}
            onQuickAction={handleQuickAction}
            onPin={handlePin}
            isPinned={pinnedTaskId === focusTaskId}
          />
          <button
            className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            onClick={() => setFocusTaskId(null)}
          >
            Revenir à la vue normale
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={modalHook.isCreateTaskModalOpen}
        onClose={modalHook.handleCloseCreateTaskModal}
        onTaskCreated={handleTaskCreated}
        parentId={modalHook.createTaskParentId}
      />

      <EditTaskModal
        isOpen={modalHook.isEditTaskModalOpen}
        onClose={modalHook.handleCloseEditModal}
        onTaskUpdated={handleTaskUpdated}
        task={modalHook.editingTask}
      />

      <AssignParentModal
        isOpen={modalHook.isAssignParentModalOpen}
        onClose={modalHook.handleCloseAssignParentModal}
        task={modalHook.assigningParentTask}
        onParentAssigned={handleTaskUpdated}
      />

      {modalHook.editingNoteTask && (
        <NoteModal
          isOpen={modalHook.isNoteModalOpen}
          onClose={modalHook.handleCloseNoteModal}
          task={modalHook.editingNoteTask}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
        />
      )}
    </div>
  )
}

// Utility function to find a task (or subtask) by id
function findTaskById(tasks: Task[], id: string | null): Task | undefined {
  for (const t of tasks) {
    if (t.id === id) return t
    if (t.subtasks && t.subtasks.length > 0) {
      const found = findTaskById(t.subtasks, id)
      if (found) return found
    }
  }
  return undefined
}