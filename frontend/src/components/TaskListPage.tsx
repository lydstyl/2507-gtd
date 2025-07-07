import React, { useEffect, useState } from 'react'
import { TaskCard } from './TaskCard'
import { CreateTaskModal } from './CreateTaskModal'
import { EditTaskModal } from './EditTaskModal'
import { AssignParentModal } from './AssignParentModal'
import { NoteModal } from './NoteModal'
import type { Task, Tag } from '../types/task'
import { api } from '../utils/api'

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [createTaskParentId, setCreateTaskParentId] = useState<
    string | undefined
  >(undefined)
  const [isAssignParentModalOpen, setIsAssignParentModalOpen] = useState(false)
  const [assigningParentTask, setAssigningParentTask] = useState<Task | null>(
    null
  )
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingNoteTask, setEditingNoteTask] = useState<Task | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Filtres
  const [importanceFilter, setImportanceFilter] = useState<number | ''>('')
  const [urgencyFilter, setUrgencyFilter] = useState<number | ''>('')
  const [tagFilter, setTagFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')

  const loadTasks = async () => {
    try {
      const tasksData = await api.getTasks()
      setTasks(tasksData)
      setFilteredTasks(tasksData)
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

  // Gérer le changement de recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
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

  // Fonction de filtrage
  const applyFilters = (tasksToFilter: Task[]) => {
    let filtered = tasksToFilter

    // Filtre par recherche textuelle
    if (searchTerm.trim()) {
      filtered = filtered.filter((task) =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par importance (au moins le niveau choisi)
    if (importanceFilter !== '') {
      filtered = filtered.filter((task) => task.importance <= importanceFilter)
    }

    // Filtre par urgence (au moins le niveau choisi)
    if (urgencyFilter !== '') {
      filtered = filtered.filter((task) => task.urgency <= urgencyFilter)
    }

    // Filtre par tag
    if (tagFilter) {
      filtered = filtered.filter((task) =>
        task.tags.some((tag) => tag.id === tagFilter)
      )
    }

    // Filtre par date
    if (dateFilter) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      filtered = filtered.filter((task) => {
        if (!task.dueDate) {
          return dateFilter === 'no-date'
        }

        // Si on filtre pour "Sans date", exclure les tâches qui ont une date
        if (dateFilter === 'no-date') {
          return false
        }

        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)

        switch (dateFilter) {
          case 'overdue':
            return taskDate < today
          case 'today':
            return taskDate.getTime() === today.getTime()
          case 'tomorrow':
            return taskDate.getTime() === tomorrow.getTime()
          case 'this-week':
            const endOfWeek = new Date(today)
            endOfWeek.setDate(today.getDate() + 7)
            return taskDate >= today && taskDate <= endOfWeek
          case 'future':
            return taskDate > tomorrow
          default:
            return true
        }
      })
    }

    return filtered
  }

  // Mettre à jour les tâches filtrées quand les filtres changent
  useEffect(() => {
    const filtered = applyFilters(tasks)
    setFilteredTasks(filtered)
  }, [
    tasks,
    searchTerm,
    importanceFilter,
    urgencyFilter,
    tagFilter,
    dateFilter
  ])

  // Gestion navigation clavier pour sélection
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (filteredTasks.length === 0 && !selectedTaskId) return
      // Navigation ↑/↓
      if (["ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault()
        let idx = filteredTasks.findIndex((t) => t.id === selectedTaskId)
        if (e.key === "ArrowDown") {
          if (idx === -1 || idx === filteredTasks.length - 1) {
            setSelectedTaskId(filteredTasks[0].id)
          } else {
            setSelectedTaskId(filteredTasks[idx + 1].id)
          }
        } else if (e.key === "ArrowUp") {
          if (idx === -1 || idx === 0) {
            setSelectedTaskId(filteredTasks[filteredTasks.length - 1].id)
          } else {
            setSelectedTaskId(filteredTasks[idx - 1].id)
          }
        }
        return
      }

      // Raccourcis édition rapide
      if (!selectedTaskId) return
      const task = tasks.find((t) => t.id === selectedTaskId)
      if (!task) return
      let update: any = {}
      let handled = false
      // Importance
      if (e.key.toLowerCase() === "i") {
        if (e.shiftKey) {
          update.importance = Math.min(5, task.importance + 1)
        } else {
          update.importance = Math.max(1, task.importance - 1)
        }
        handled = true
      }
      // Urgence
      if (e.key.toLowerCase() === "u") {
        if (e.shiftKey) {
          update.urgency = Math.min(5, task.urgency + 1)
        } else {
          update.urgency = Math.max(1, task.urgency - 1)
        }
        handled = true
      }
      // Priorité
      if (e.key.toLowerCase() === "p") {
        if (e.shiftKey) {
          update.priority = Math.min(5, task.priority + 1)
        } else {
          update.priority = Math.max(1, task.priority - 1)
        }
        handled = true
      }
      // Due date +1j/-1j
      if (e.key.toLowerCase() === "d") {
        let baseDate = task.dueDate ? new Date(task.dueDate) : new Date()
        if (e.shiftKey) {
          baseDate.setDate(baseDate.getDate() - 1)
        } else {
          baseDate.setDate(baseDate.getDate() + 1)
        }
        update.dueDate = baseDate.toISOString()
        handled = true
      }
      // Due date +1 semaine
      if (e.key.toLowerCase() === "w") {
        let baseDate = task.dueDate ? new Date(task.dueDate) : new Date()
        baseDate.setDate(baseDate.getDate() + 7)
        update.dueDate = baseDate.toISOString()
        handled = true
      }
      // Due date +1 mois
      if (e.key.toLowerCase() === "m") {
        let baseDate = task.dueDate ? new Date(task.dueDate) : new Date()
        baseDate.setMonth(baseDate.getMonth() + 1)
        update.dueDate = baseDate.toISOString()
        handled = true
      }
      // Tags 1-9
      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1
        if (tags[idx]) {
          const tagId = tags[idx].id
          const hasTag = task.tags.some((t) => t.id === tagId)
          update.tagIds = hasTag
            ? task.tags.filter((t) => t.id !== tagId).map((t) => t.id)
            : [...task.tags.map((t) => t.id), tagId]
          handled = true
        }
      }
      if (handled) {
        e.preventDefault()
        try {
          await api.updateTask(task.id, update)
          // Après modif, recharge les tâches
          await loadTasks()
          // Si la tâche n'est plus dans filteredTasks, focus spécial
          setTimeout(() => {
            const stillVisible = applyFilters(tasks).some((t) => t.id === task.id)
            if (!stillVisible) {
              setFocusTaskId(task.id)
            } else {
              setFocusTaskId(null)
            }
          }, 300)
        } catch (err) {
          alert("Erreur lors de la modification rapide de la tâche")
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [filteredTasks, selectedTaskId, tasks, tags])

  // Focus spécial si la tâche modifiée sort des filtres
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)

  // Sélection par clic
  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
  }

  const handleTaskDeleted = async (taskId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await api.deleteTask(taskId)
        loadTasks()
      } catch (err) {
        console.error('Erreur lors de la suppression de la tâche:', err)
        alert('Erreur lors de la suppression de la tâche')
      }
    }
  }

  const handleCreateTask = () => {
    setCreateTaskParentId(undefined)
    setIsCreateTaskModalOpen(true)
  }

  const handleCreateSubtask = (parentId: string) => {
    setCreateTaskParentId(parentId)
    setIsCreateTaskModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsEditTaskModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditTaskModalOpen(false)
    setEditingTask(null)
  }

  const handleCloseCreateTaskModal = () => {
    setIsCreateTaskModalOpen(false)
    setCreateTaskParentId(undefined)
  }

  const handleAssignParent = (task: Task) => {
    setAssigningParentTask(task)
    setIsAssignParentModalOpen(true)
  }

  const handleCloseAssignParentModal = () => {
    setIsAssignParentModalOpen(false)
    setAssigningParentTask(null)
  }

  const handleEditNote = (task: Task) => {
    setEditingNoteTask(task)
    setIsNoteModalOpen(true)
  }

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false)
    setEditingNoteTask(null)
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

  const clearAllFilters = () => {
    setSearchTerm('')
    setImportanceFilter('')
    setUrgencyFilter('')
    setTagFilter('')
    setDateFilter('')
  }

  const hasActiveFilters =
    searchTerm ||
    importanceFilter !== '' ||
    urgencyFilter !== '' ||
    tagFilter ||
    dateFilter

  if (loading) return <div className='p-8 text-center'>Chargement…</div>
  if (error) return <div className='p-8 text-red-500'>{error}</div>

  return (
    <div className='max-w-4xl mx-auto p-4'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Toutes les tâches</h1>
        <button
          onClick={handleCreateTask}
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
        >
          + Nouvelle tâche
        </button>
      </div>

      {/* Aide raccourcis clavier */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
        <div className="font-semibold mb-1">Raccourcis clavier (sur la tâche sélectionnée) :</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div><b>I</b> / <b>Shift+I</b> : Importance -/+</div>
          <div><b>U</b> / <b>Shift+U</b> : Urgence -/+</div>
          <div><b>P</b> / <b>Shift+P</b> : Priorité -/+</div>
          <div><b>D</b> / <b>Shift+D</b> : Date +1j / -1j</div>
          <div><b>W</b> : +1 semaine à la date</div>
          <div><b>M</b> : +1 mois à la date</div>
          <div><b>1-9</b> : Ajouter/enlever tag 1 à 9</div>
          <div><b>↑ / ↓</b> : Sélectionner la tâche précédente/suivante</div>
        </div>
      </div>

      {/* Affichage dynamique des tags 1-9 */}
      {tags.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-gray-600 mb-1">Tags accessibles par raccourci :</div>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 9).map((tag, idx) => (
              <div key={tag.id} className="flex items-center px-2 py-1 rounded border border-gray-200 bg-gray-50 text-xs">
                <span className="font-mono font-bold mr-1">{idx + 1}.</span>
                <span
                  className="w-3 h-3 rounded-full inline-block mr-1"
                  style={{ backgroundColor: tag.color || '#6b7280' }}
                ></span>
                <span>{tag.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className='mb-6'>
        <div className='relative'>
          <input
            type='text'
            placeholder='Rechercher une tâche...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <svg
              className='h-5 w-5 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className='mb-6 bg-gray-50 p-4 rounded-lg'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-sm font-medium text-gray-700'>Filtres</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className='text-sm text-blue-600 hover:text-blue-800 underline'
            >
              Effacer tous les filtres
            </button>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Filtre par importance */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Importance
            </label>
            <select
              value={importanceFilter}
              onChange={(e) =>
                setImportanceFilter(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              <option value=''>Toutes</option>
              <option value='1'>Au moins Critique (1)</option>
              <option value='2'>Au moins Très élevée (1-2)</option>
              <option value='3'>Au moins Élevée (1-3)</option>
              <option value='4'>Au moins Moyenne (1-4)</option>
              <option value='5'>Au moins Faible (1-5)</option>
            </select>
          </div>

          {/* Filtre par urgence */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Urgence
            </label>
            <select
              value={urgencyFilter}
              onChange={(e) =>
                setUrgencyFilter(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              <option value=''>Toutes</option>
              <option value='1'>Au moins Très urgente (1)</option>
              <option value='2'>Au moins Urgente (1-2)</option>
              <option value='3'>Au moins Normale (1-3)</option>
              <option value='4'>Au moins Peu urgente (1-4)</option>
              <option value='5'>Au moins Non urgente (1-5)</option>
            </select>
          </div>

          {/* Filtre par tag */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Tag
            </label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              <option value=''>Tous les tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par date */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Date limite
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              <option value=''>Toutes les dates</option>
              <option value='overdue'>En retard</option>
              <option value='today'>Aujourd'hui</option>
              <option value='tomorrow'>Demain</option>
              <option value='this-week'>Cette semaine</option>
              <option value='future'>Plus tard</option>
              <option value='no-date'>Sans date</option>
            </select>
          </div>
        </div>

        {/* Compteur de résultats */}
        {(hasActiveFilters || filteredTasks.length !== tasks.length) && (
          <div className='mt-4 text-sm text-gray-600'>
            {filteredTasks.length} tâche{filteredTasks.length !== 1 ? 's' : ''}{' '}
            trouvée{filteredTasks.length !== 1 ? 's' : ''}
            {filteredTasks.length !== tasks.length && ` sur ${tasks.length}`}
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className='text-gray-500 text-center py-8'>
          Aucune tâche trouvée.
          <br />
          <button
            onClick={handleCreateTask}
            className='text-blue-600 hover:text-blue-800 underline mt-2'
          >
            Créer votre première tâche
          </button>
        </div>
      ) : filteredTasks.length === 0 && hasActiveFilters ? (
        <div className='text-gray-500 text-center py-8'>
          Aucune tâche ne correspond aux filtres sélectionnés.
          <br />
          <button
            onClick={clearAllFilters}
            className='text-blue-600 hover:text-blue-800 underline mt-2'
          >
            Effacer les filtres
          </button>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredTasks.map((task, index) => (
            <div key={task.id} onClick={() => handleSelectTask(task.id)}>
              <TaskCard
                task={task}
                level={0}
                onEdit={handleEditTask}
                onDelete={handleTaskDeleted}
                onCreateSubtask={handleCreateSubtask}
                onAssignParent={handleAssignParent}
                onEditNote={handleEditNote}
                isEven={index % 2 === 1}
                isSelected={selectedTaskId === task.id}
              />
            </div>
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
        isOpen={isCreateTaskModalOpen}
        onClose={handleCloseCreateTaskModal}
        onTaskCreated={handleTaskCreated}
        parentId={createTaskParentId}
      />

      <EditTaskModal
        isOpen={isEditTaskModalOpen}
        onClose={handleCloseEditModal}
        onTaskUpdated={handleTaskUpdated}
        task={editingTask}
      />

      <AssignParentModal
        isOpen={isAssignParentModalOpen}
        onClose={handleCloseAssignParentModal}
        task={assigningParentTask}
        onParentAssigned={handleTaskUpdated}
      />

      {editingNoteTask && (
        <NoteModal
          isOpen={isNoteModalOpen}
          onClose={handleCloseNoteModal}
          task={editingNoteTask}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
        />
      )}
    </div>
  )
}
