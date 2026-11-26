import { useEffect, useState, useRef, useCallback } from 'react'
import { SwipeableTaskCard } from './SwipeableTaskCard'
import { CreateTaskModal } from './CreateTaskModal'
import { EditTaskModal } from './EditTaskModal'
import { AssignParentModal } from './AssignParentModal'
import { NoteModal } from './NoteModal'
import { TaskFilters } from './TaskFilters'
import { ShortcutsHelp } from './ShortcutsHelp'
import { PinnedTaskSection } from './PinnedTaskSection'
import { FloatingActionButton } from './FloatingActionButton'
import { QuickAddInput } from './QuickAddInput'
import { PromptTaskModal } from './PromptTaskModal'
import { BottomActionBar } from './BottomActionBar'
 import type { Task, Tag, UpdateTaskData } from '../types/task'
import { api } from '../utils/api'
import { useTaskFilters } from '../hooks/useTaskFilters'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useModalState } from '../hooks/useModalState'
import {
  computeImportanceUpdate,
  computeComplexityUpdate,
  computeDateUpdate,
  toggleTagUpdate,
  withDateConsistency,
} from '../utils/shortcutActions'

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
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)

  const pinnedRef = useRef<HTMLDivElement>(null)
  const taskCreatedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // true une fois que l'auto-sélection du refresh a eu lieu (évite de re-forcer
  // la sélection après une déselection manuelle ou un rechargement des tâches).
  const didAutoSelectRef = useRef(false)

  // Custom hooks
  const filterHook = useTaskFilters(tasks)
  const modalHook = useModalState()

  // Lazy-load : la liste n'embarque plus les notes (split des notes API).
  // Quand le modal note s'ouvre, on charge la tâche complète (avec sa note)
  // via GET /api/tasks/:id. Pendant le chargement on retombe sur la version
  // liste (sans note, avec hasNote) pour le titre + spinner.
  const [noteTaskDetail, setNoteTaskDetail] = useState<Task | null>(null)
  const noteTaskId = modalHook.editingNoteTask?.id
  useEffect(() => {
    if (!noteTaskId) {
      setNoteTaskDetail(null)
      return
    }
    let cancelled = false
    api
      .getTask(noteTaskId)
      .then((detail) => {
        if (!cancelled) setNoteTaskDetail(detail)
      })
      .catch((err) => {
        console.error('Erreur chargement de la note:', err)
      })
    return () => {
      cancelled = true
    }
  }, [noteTaskId])
  const editingNoteTask = noteTaskId
    ? noteTaskDetail || modalHook.editingNoteTask
    : undefined

  const loadTasks = async () => {
    try {
      const tasksData = await api.getRootTasks()
      setTasks(tasksData)
     } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
  }

  const loadTags = async () => {
    try {
      const tagsData = await api.getTags()
      setTags(tagsData)
     } catch (err: unknown) {
        console.error('Erreur lors du chargement des tags:', err)
      }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadTasks(), loadTags()]).finally(() => setLoading(false))
  }, [])

  // Auto-sélection de la 1ʳᵉ tâche (haut à gauche) au premier chargement / refresh,
  // sans clic ni flèches. Une seule fois par montage : le ref empêche de re-forcer
  // la sélection après une déselection manuelle ou un rechargement des tâches.
  // filteredTasks vide = pas encore chargé → on attend (le ref n'est pas posé).
  useEffect(() => {
    if (didAutoSelectRef.current) return
    if (selectedTaskId) return
    if (filterHook.filteredTasks.length === 0) return
    setSelectedTaskId(filterHook.filteredTasks[0].id)
    didAutoSelectRef.current = true
  }, [filterHook.filteredTasks, selectedTaskId])

  useEffect(() => {
    return () => {
      if (taskCreatedTimeoutRef.current) {
        clearTimeout(taskCreatedTimeoutRef.current)
      }
    }
  }, [])

  const handleTaskCreated = useCallback(async () => {
    if (taskCreatedTimeoutRef.current) {
      clearTimeout(taskCreatedTimeoutRef.current)
    }
    taskCreatedTimeoutRef.current = setTimeout(() => {
      loadTasks()
    }, 500)
  }, [])

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
    isNoteModalOpen: modalHook.isNoteModalOpen,
    noteTaskId: noteTaskId ?? null,
    onTaskDeleted: handleTaskDeleted,
    onTasksReload: loadTasks,
    setPinnedTaskId,
    setShowShortcutsHelp,
    setShowFilters,
    setFocusTaskId,
    onOpenPromptModal: () => setShowPromptModal((v) => !v),
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

  // Boutons d'action rapide — clavier et boutons partagent la MÊME logique
  // (shortcutActions) : zéro duplication. Gère les tags (tag:<id>) et toutes
  // les dates (aujourd'hui / +1j / -1j / +1 sem / +1 mois / enlever).
  const handleQuickAction = async (taskId: string, action: string) => {
    const task = findTaskById(tasks, taskId)
    if (!task) return

    if (action === 'delete') {
      try {
        await handleTaskDeleted(taskId)
      } catch {
        alert("Erreur lors de l'action rapide")
      }
      return
    }

    let update: Partial<UpdateTaskData>
    if (action.startsWith('tag:')) {
      const tag = tags.find((t) => t.id === action.slice(4))
      if (!tag) return
      update = toggleTagUpdate(task, tag)
    } else {
      switch (action) {
        case 'importance-up': update = computeImportanceUpdate(task, 'up'); break
        case 'importance-down': update = computeImportanceUpdate(task, 'down'); break
        case 'complexity-up': update = computeComplexityUpdate(task, 'up'); break
        case 'complexity-down': update = computeComplexityUpdate(task, 'down'); break
        case 'date-today': update = computeDateUpdate(task, 'today'); break
        case 'date-tomorrow': update = computeDateUpdate(task, 'tomorrow'); break
        case 'date-yesterday': update = computeDateUpdate(task, 'yesterday'); break
        case 'date-week': update = computeDateUpdate(task, 'week'); break
        case 'date-month': update = computeDateUpdate(task, 'month'); break
        case 'date-remove': update = computeDateUpdate(task, 'remove'); break
        default: return
      }
    }

    try {
      // Règle « date limite ≥ date prévue » (partagée clavier + boutons).
      await api.updateTask(taskId, withDateConsistency(update, task))
      await loadTasks()
     } catch {
       alert("Erreur lors de l'action rapide")
     }
  }

  // Raccourci global (clavier A) → bouton : toutes les tâches en retard →
  // aujourd'hui (avec confirmation). Visible sur toutes les tailles d'écran.
  const handleOverdueToToday = async () => {
    if (!window.confirm("Mettre toutes les tâches en retard à aujourd'hui ?")) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdueTasks = tasks.filter(t => t.plannedDate && new Date(t.plannedDate) < today)
    const todayFormatted = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0')
    try {
      for (const t of overdueTasks) {
        await api.updateTask(t.id, { plannedDate: todayFormatted })
      }
      await loadTasks()
    } catch {
      alert("Erreur lors de la mise à jour des tâches en retard")
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

  const handleReorderSubtasks = async (taskId: string, newPosition: number) => {
    try {
      await api.updateTask(taskId, {
        position: newPosition
      })
      loadTasks()
    } catch (err) {
      console.error('Erreur lors de la réorganisation de la sous-tâche:', err)
      throw err
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

  const handleSaveNoteName = async (taskId: string, name: string) => {
    try {
      await api.updateTask(taskId, { name })
      loadTasks()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du titre:', err)
      alert('Erreur lors de la sauvegarde du titre')
      throw err
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

  // Détacher un tag d'une tâche depuis la liste (bouton × au survol du tag)
  const handleRemoveTag = async (taskId: string, tagId: string) => {
    const task = findTaskById(tasks, taskId)
    if (!task) return
    const newTagIds = (task.tags || []).map((t) => t.id).filter((id) => id !== tagId)
    try {
      await api.updateTask(taskId, { tagIds: newTagIds })
      loadTasks()
    } catch (err) {
      console.error('Erreur lors du retrait du tag:', err)
      alert("Erreur lors du retrait du tag")
    }
  }

  if (loading) return <div className='p-8 text-center'>Chargement…</div>
  if (error) return <div className='p-8 text-red-500'>{error}</div>

  return (
    <div className='w-full p-4'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Toutes les tâches</h1>
        <div className='flex items-center space-x-2'>
          <button
            onClick={handleOverdueToToday}
            className='px-3 py-2 rounded-md text-sm font-medium transition-colors bg-amber-100 hover:bg-amber-200 text-amber-700'
            title="Toutes les tâches en retard → aujourd'hui (raccourci A)"
          >
            ⏰ En retard → aujourd'hui
          </button>
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              showQuickAdd
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Ajout rapide"
          >
            ⚡ Rapide
          </button>
          <button
            onClick={() => setShowPromptModal(true)}
            className='px-3 py-2 rounded-md text-sm font-medium transition-colors bg-purple-100 hover:bg-purple-200 text-purple-700'
            title="Créer une tâche « Pour IA » à partir d'un prompt (raccourci K)"
          >
            🤖 Prompter tâche <kbd className='ml-1 px-1 py-0.5 text-[10px] bg-purple-200 border border-purple-300 rounded font-mono text-purple-700 select-none'>K</kbd>
          </button>
          <button
            onClick={modalHook.handleCreateTask}
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
          >
            + Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Quick Add Input */}
      <QuickAddInput
        isVisible={showQuickAdd}
        onTaskCreated={() => {
          setShowQuickAdd(false)
          handleTaskCreated()
        }}
        onCancel={() => setShowQuickAdd(false)}
        placeholder="Nom de la nouvelle tâche..."
      />

      {/* Prompt Task Modal (IA) */}
      <PromptTaskModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        onTaskCreated={handleTaskCreated}
      />

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
        onReorderSubtasks={handleReorderSubtasks}
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
        dateFilters={filterHook.dateFilters}
        toggleDateFilter={filterHook.toggleDateFilter}
        updatedAtFilter={filterHook.updatedAtFilter}
        setUpdatedAtFilter={filterHook.setUpdatedAtFilter}
        createdAtFilter={filterHook.createdAtFilter}
        setCreatedAtFilter={filterHook.setCreatedAtFilter}
        tags={tags}
        statusFilters={filterHook.statusFilters}
        toggleStatusFilter={filterHook.toggleStatusFilter}
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
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-8 gap-3 md:gap-4'>
          {filterHook.filteredTasks
            .filter(task => !pinnedTaskId || task.id !== pinnedTaskId)
            .map((task, index) => (
              <SwipeableTaskCard
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
                onReorderSubtasks={handleReorderSubtasks}
                isEven={index % 2 === 1}
                onSelectTask={handleSelectTask}
                selectedTaskId={selectedTaskId ?? undefined}
                onQuickAction={handleQuickAction}
                tags={tags}
                onPin={handlePin}
                isPinned={pinnedTaskId === task.id}
                onRemoveTag={handleRemoveTag}
              />
            ))}
        </div>
      )}

      {focusTaskId && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="mb-2 text-yellow-800 font-semibold">
            Tâche modifiée hors de la vue filtrée
          </div>
          <SwipeableTaskCard
            task={tasks.find((t) => t.id === focusTaskId)!}
            isSelected={true}
            onEdit={modalHook.handleEditTask}
            onDelete={handleTaskDeleted}
            onCreateSubtask={modalHook.handleCreateSubtask}
            onAssignParent={modalHook.handleAssignParent}
            onEditNote={modalHook.handleEditNote}
            onMarkCompleted={handleMarkCompleted}
            onWorkedOn={handleWorkedOn}
            onReorderSubtasks={handleReorderSubtasks}
            onSelectTask={handleSelectTask}
            selectedTaskId={selectedTaskId ?? undefined}
            onQuickAction={handleQuickAction}
            tags={tags}
            onPin={handlePin}
            isPinned={pinnedTaskId === focusTaskId}
            onRemoveTag={handleRemoveTag}
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

      {editingNoteTask && (
        <NoteModal
          isOpen={modalHook.isNoteModalOpen}
          onClose={modalHook.handleCloseNoteModal}
          task={editingNoteTask}
          onSave={handleSaveNote}
          onSaveName={handleSaveNoteName}
          onSaveStatus={async (taskId, newStatus) => {
            await api.updateTask(taskId, { status: newStatus })
            await loadTasks()
          }}
          onDelete={handleDeleteNote}
          onMarkCompleted={async (taskId) => {
            await api.markTaskCompleted(taskId)
            await loadTasks()
          }}
          onOpenEdit={(task) => {
            modalHook.handleCloseNoteModal()
            modalHook.handleEditTask(task)
          }}
        />
      )}

      {/* Floating Action Button for mobile task creation */}
      <FloatingActionButton
        onClick={modalHook.handleCreateTask}
        ariaLabel="Créer une nouvelle tâche"
      />

      {/* Bottom Action Bar for mobile navigation */}
      <BottomActionBar
        onCreateTask={modalHook.handleCreateTask}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefreshTasks={loadTasks}
        onToggleShortcuts={() => setShowShortcutsHelp(!showShortcutsHelp)}
        onToggleQuickAdd={() => setShowQuickAdd(!showQuickAdd)}
        hasActiveFilters={filterHook.hasActiveFilters}
        isQuickAddVisible={showQuickAdd}
        isFiltersVisible={showFilters}
      />
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