import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiKeysApi } from '../services/api'

export const API_KEYS_QUERY_KEYS = {
  all: ['apiKeys'] as const,
  list: () => [...API_KEYS_QUERY_KEYS.all, 'list'] as const,
}

export function useApiKeys() {
  return useQuery({
    queryKey: API_KEYS_QUERY_KEYS.list(),
    queryFn: apiKeysApi.list,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, expiresAt }: { name: string; expiresAt?: string }) =>
      apiKeysApi.create(name, expiresAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEYS.all })
    },
  })
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.regenerate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEYS.all })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEYS.all })
    },
  })
}
