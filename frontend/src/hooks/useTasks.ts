import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../services/api'
 import type { CreateTaskData, UpdateTaskData } from '../types/task'

export const TASKS_QUERY_KEYS = {
  all: ['tasks'] as const,
  lists: () => [...TASKS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any> = {}) => [...TASKS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...TASKS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TASKS_QUERY_KEYS.details(), id] as const,
  root: () => [...TASKS_QUERY_KEYS.all, 'root'] as const,
  withSubtasks: () => [...TASKS_QUERY_KEYS.all, 'withSubtasks'] as const,
} as const

// Get all tasks
export function useTasks() {
  return useQuery({
    queryKey: TASKS_QUERY_KEYS.list(),
    queryFn: tasksApi.getTasks,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Get all tasks including subtasks
export function useAllTasks() {
  return useQuery({
    queryKey: TASKS_QUERY_KEYS.withSubtasks(),
    queryFn: tasksApi.getAllTasks,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Get root tasks only
export function useRootTasks() {
  return useQuery({
    queryKey: TASKS_QUERY_KEYS.root(),
    queryFn: tasksApi.getRootTasks,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Get single task
export function useTask(id: string) {
  return useQuery({
    queryKey: TASKS_QUERY_KEYS.detail(id),
    queryFn: () => tasksApi.getTask(id),
    enabled: !!id,
  })
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskData) => tasksApi.createTask(data),
    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEYS.all })
    },
  })
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      tasksApi.updateTask(id, data),
    onSuccess: (updatedTask) => {
      // Update the specific task in cache
      queryClient.setQueryData(
        TASKS_QUERY_KEYS.detail(updatedTask.id),
        updatedTask
      )
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEYS.lists() })
    },
  })
}

// Update task note mutation
export function useUpdateTaskNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      tasksApi.updateTaskNote(id, note),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(
        TASKS_QUERY_KEYS.detail(updatedTask.id),
        updatedTask
      )
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEYS.lists() })
    },
  })
}

// Delete task note mutation
export function useDeleteTaskNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTaskNote(id),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(
        TASKS_QUERY_KEYS.detail(updatedTask.id),
        updatedTask
      )
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEYS.lists() })
    },
  })
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: TASKS_QUERY_KEYS.detail(deletedId) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEYS.lists() })
    },
  })
}

// Delete all tasks mutation
export function useDeleteAllTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.deleteAllTasks,
    onSuccess: () => {
      // Clear all task-related cache
      queryClient.removeQueries({ queryKey: TASKS_QUERY_KEYS.all })
    },
  })
}

// Export tasks
export function useExportTasks() {
  return useMutation({
    mutationFn: tasksApi.exportTasks,
  })
}

// Import tasks
export function useImportTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (csvContent: string) => tasksApi.importTasks(csvContent),
    onSuccess: () => {
      // Invalidate all task queries after import
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEYS.all })
    },
  })
}