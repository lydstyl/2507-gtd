export interface ApiKeyRecord {
  id: string
  name: string
  keyHash: string
  prefix: string
  userId: string
  lastUsedAt: Date | null
  createdAt: Date
  expiresAt: Date | null
}

export interface IApiKeyRepository {
  create(data: {
    name: string
    keyHash: string
    prefix: string
    userId: string
    expiresAt?: Date
  }): Promise<ApiKeyRecord>

  findByUserId(userId: string): Promise<Omit<ApiKeyRecord, 'keyHash'>[]>

  findById(id: string): Promise<ApiKeyRecord | null>

  findByPrefix(prefix: string): Promise<ApiKeyRecord[]>

  updateLastUsed(id: string): Promise<void>

  delete(id: string, userId: string): Promise<boolean>
}
