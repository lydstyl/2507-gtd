import { useState } from 'react'
import type { Task } from '../types/task'

export function useModalState() {
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [createTaskParentId, setCreateTaskParentId] = useState<string | undefined>(undefined)
  const [isAssignParentModalOpen, setIsAssignParentModalOpen] = useState(false)
  const [assigningParentTask, setAssigningParentTask] = useState<Task | null>(null)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingNoteTask, setEditingNoteTask] = useState<Task | null>(null)

  const isAnyModalOpen = isCreateTaskModalOpen || isEditTaskModalOpen || isAssignParentModalOpen || isNoteModalOpen

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

  return {
    // State
    isCreateTaskModalOpen,
    isEditTaskModalOpen,
    editingTask,
    createTaskParentId,
    isAssignParentModalOpen,
    assigningParentTask,
    isNoteModalOpen,
    editingNoteTask,
    isAnyModalOpen,

    // Actions
    handleCreateTask,
    handleCreateSubtask,
    handleEditTask,
    handleCloseEditModal,
    handleCloseCreateTaskModal,
    handleAssignParent,
    handleCloseAssignParentModal,
    handleEditNote,
    handleCloseNoteModal
  }
}