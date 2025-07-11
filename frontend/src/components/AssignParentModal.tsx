import { useState, useEffect } from 'react'
import type { Task } from '../types/task'
import { api } from '../utils/api'

interface AssignParentModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onParentAssigned: () => void
}

export function AssignParentModal({ isOpen, onClose, task, onParentAssigned }: AssignParentModalProps) {
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    if (isOpen && task) {
      loadAvailableTasks()
    }
  }, [isOpen, task])

  const loadAvailableTasks = async () => {
    try {
      setLoading(true)
      const tasks = await api.getTasks()
      
      // Filtrer les tâches disponibles (exclure la tâche actuelle et ses sous-tâches)
      const availableTasks = tasks.filter((t: Task) => {
        // Exclure la tâche actuelle
        if (t.id === task?.id) return false
        
        // Exclure les sous-tâches de la tâche actuelle
        if (task && isDescendantOf(t, task, tasks)) return false
        
        // Exclure les tâches qui ont déjà cette tâche comme parent
        if (t.parentId === task?.id) return false
        
        return true
      })
      
      // Trier par ordre alphabétique croissant
      const sortedTasks = availableTasks.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
      
      setAvailableTasks(sortedTasks)
    } catch (err: any) {
      setError('Erreur lors du chargement des tâches')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fonction récursive pour vérifier si une tâche est un descendant d'une autre
  const isDescendantOf = (potentialDescendant: Task, ancestor: Task, allTasks: Task[]): boolean => {
    if (potentialDescendant.parentId === ancestor.id) return true
    
    const parent = allTasks.find(t => t.id === potentialDescendant.parentId)
    if (!parent) return false
    
    return isDescendantOf(parent, ancestor, allTasks)
  }

  const handleAssignParent = async () => {
    if (!task || !selectedParentId) return

    try {
      setLoading(true)
      setError(null)

      // Mettre à jour la tâche avec le nouveau parentId
      // Envoyer seulement les champs nécessaires pour la mise à jour
      await api.updateTask(task.id, {
        name: task.name,
        link: task.link,
        importance: task.importance,
        urgency: task.urgency,
        priority: task.priority,
        dueDate: task.dueDate,
        parentId: selectedParentId === 'none' ? undefined : selectedParentId,
        tagIds: task.tags.map(tag => tag.id)
      })

      onParentAssigned()
      onClose()
      setSelectedParentId('')
    } catch (err: any) {
      setError('Erreur lors de l\'assignation de la tâche parente')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveParent = async () => {
    if (!task) return

    console.log('Suppression du parent pour la tâche:', task.name, 'parentId actuel:', task.parentId)

    try {
      setLoading(true)
      setError(null)

      // Envoyer seulement les champs nécessaires pour la mise à jour
      const updateData = {
        name: task.name,
        link: task.link,
        importance: task.importance,
        urgency: task.urgency,
        priority: task.priority,
        dueDate: task.dueDate,
        parentId: null as any, // Utiliser null pour supprimer le parent (cast pour éviter l'erreur TypeScript)
        tagIds: task.tags.map(tag => tag.id)
      }
      
      console.log('Données envoyées au backend:', updateData)
      const result = await api.updateTask(task.id, updateData)
      console.log('Réponse du backend:', result)

      console.log('Parent supprimé avec succès')
      
      // Attendre un peu avant de fermer pour s'assurer que la mise à jour est traitée
      setTimeout(() => {
        onParentAssigned()
        onClose()
        setSelectedParentId('')
      }, 500)
    } catch (err: any) {
      setError('Erreur lors de la suppression de la tâche parente')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !task) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Assigner une tâche parente
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Tâche à modifier : <span className="font-medium">{task.name}</span>
          </p>
          
          {task.parentId && (
            <p className="text-sm text-gray-600 mb-4">
              Tâche parente actuelle : <span className="font-medium">
                {availableTasks.find(t => t.id === task.parentId)?.name || 'Tâche parente'}
              </span>
            </p>
          )}
          
          {/* Debug info */}
          <p className="text-xs text-gray-400">
            Debug: parentId = {task.parentId ? `"${task.parentId}"` : 'undefined'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner une nouvelle tâche parente
          </label>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Champ de recherche */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Rechercher une tâche parente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              {/* Liste des tâches avec recherche */}
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                <div className="p-2">
                  <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="radio"
                      name="parentTask"
                      value=""
                      checked={selectedParentId === ""}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-600">Choisir une tâche parente...</span>
                  </label>
                  
                  <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="radio"
                      name="parentTask"
                      value="none"
                      checked={selectedParentId === "none"}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-600">Aucune tâche parente (tâche principale)</span>
                  </label>
                  
                  {availableTasks
                    .filter(task => 
                      searchTerm === '' || 
                      task.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((availableTask) => (
                      <label key={availableTask.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="radio"
                          name="parentTask"
                          value={availableTask.id}
                          checked={selectedParentId === availableTask.id}
                          onChange={(e) => setSelectedParentId(e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-900">{availableTask.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          
          {task.parentId && (
            <button
              onClick={handleRemoveParent}
              className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md transition-colors"
              disabled={loading}
            >
              Supprimer parent
            </button>
          )}
          
          <button
            onClick={handleAssignParent}
            disabled={loading || !selectedParentId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Assignation...' : 'Assigner'}
          </button>
        </div>
      </div>
    </div>
  )
} 