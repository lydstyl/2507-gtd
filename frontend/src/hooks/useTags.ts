import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tagsApi } from '../services/api'
 import type { CreateTagData } from '../types/task'

export const TAGS_QUERY_KEYS = {
  all: ['tags'] as const,
  lists: () => [...TAGS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any> = {}) => [...TAGS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...TAGS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TAGS_QUERY_KEYS.details(), id] as const,
} as const

// Get all tags
export function useTags() {
  return useQuery({
    queryKey: TAGS_QUERY_KEYS.list(),
    queryFn: tagsApi.getTags,
    staleTime: 1000 * 60 * 5, // 5 minutes - tags don't change often
  })
}

// Get single tag
export function useTag(id: string) {
  return useQuery({
    queryKey: TAGS_QUERY_KEYS.detail(id),
    queryFn: () => tagsApi.getTag(id),
    enabled: !!id,
  })
}

// Create tag mutation
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTagData) => tagsApi.createTag(data),
    onSuccess: () => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEYS.all })
    },
  })
}

// Update tag mutation
export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTagData> }) =>
      tagsApi.updateTag(id, data),
    onSuccess: (updatedTag) => {
      // Update the specific tag in cache
      queryClient.setQueryData(
        TAGS_QUERY_KEYS.detail(updatedTag.id),
        updatedTag
      )
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEYS.lists() })
    },
  })
}

// Delete tag mutation
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tagsApi.deleteTag(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: TAGS_QUERY_KEYS.detail(deletedId) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEYS.lists() })
      // Also invalidate tasks since they might reference this tag
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}