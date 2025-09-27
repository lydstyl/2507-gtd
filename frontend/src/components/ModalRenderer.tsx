import { useApp } from '../stores/AppContext'
import { CreateTaskModal } from './CreateTaskModal'
import { EditTaskModal } from './EditTaskModal'
import { CreateTagModal } from './CreateTagModal'
import { TagManagerModal } from './TagManagerModal'
import { AssignParentModal } from './AssignParentModal'
import { NoteModal } from './NoteModal'
 import { useAllTasks } from '../hooks/useTasks'
import { api } from '../utils/api'

 export function ModalRenderer() {
   const { state, dispatch } = useApp()
   const { data: tasks = [] } = useAllTasks()

  const handleCloseModal = (modalType: keyof typeof state.modals) => {
    dispatch({ type: 'CLOSE_MODAL', payload: modalType })
  }

  const handleTaskCreated = () => {
    // Refresh tasks - this will be handled by React Query
    handleCloseModal('createTask')
  }

  const handleTaskUpdated = () => {
    // Refresh tasks - this will be handled by React Query
    handleCloseModal('editTask')
    handleCloseModal('assignParent')
  }

  const handleTagCreated = () => {
    // Refresh tags - this will be handled by React Query
    handleCloseModal('createTag')
  }



  const handleSaveNote = async (taskId: string, note: string) => {
    try {
      await api.updateTaskNote(taskId, note)
      handleCloseModal('note')
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Erreur lors de la sauvegarde de la note')
    }
  }

  const handleDeleteNote = async (taskId: string) => {
    try {
      await api.deleteTaskNote(taskId)
      handleCloseModal('note')
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Erreur lors de la suppression de la note')
    }
  }

  // Find the task being edited
  const editingTask = state.modals.editTask.taskId
    ? tasks.find(t => t.id === state.modals.editTask.taskId)
    : undefined

  // Find the task being assigned a parent
  const assigningParentTask = state.modals.assignParent.taskId
    ? tasks.find(t => t.id === state.modals.assignParent.taskId)
    : undefined

  // Find the task whose note is being edited
  const editingNoteTask = state.modals.note.taskId
    ? tasks.find(t => t.id === state.modals.note.taskId)
    : undefined

  return (
    <>
      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={state.modals.createTask.isOpen}
        onClose={() => handleCloseModal('createTask')}
        onTaskCreated={handleTaskCreated}
        parentId={state.modals.createTask.parentId || undefined}
      />

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          isOpen={state.modals.editTask.isOpen}
          onClose={() => handleCloseModal('editTask')}
          onTaskUpdated={handleTaskUpdated}
          task={editingTask}
        />
      )}

      {/* Create Tag Modal */}
      <CreateTagModal
        isOpen={state.modals.createTag.isOpen}
        onClose={() => handleCloseModal('createTag')}
        onTagCreated={handleTagCreated}
      />

      {/* Tag Manager Modal */}
      <TagManagerModal
        isOpen={state.modals.tagManager.isOpen}
        onClose={() => handleCloseModal('tagManager')}
      />

      {/* Assign Parent Modal */}
      {assigningParentTask && (
        <AssignParentModal
          isOpen={state.modals.assignParent.isOpen}
          onClose={() => handleCloseModal('assignParent')}
          task={assigningParentTask}
          onParentAssigned={handleTaskUpdated}
        />
      )}

      {/* Note Modal */}
      {editingNoteTask && (
        <NoteModal
          isOpen={state.modals.note.isOpen}
          onClose={() => handleCloseModal('note')}
          task={editingNoteTask}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
        />
      )}
    </>
  )
}