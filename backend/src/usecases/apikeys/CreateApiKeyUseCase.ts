import { randomBytes } from 'crypto'
import bcrypt from 'bcrypt'
import { IApiKeyRepository } from '../../interfaces/repositories/ApiKeyRepository'

const KEY_PREFIX_DISPLAY = 12 // chars stored as prefix for fast lookup

export interface CreateApiKeyInput {
  userId: string
  name: string
  expiresAt?: Date
}

export interface CreateApiKeyResult {
  id: string
  name: string
  prefix: string
  key: string // raw key — returned only once
  createdAt: Date
  expiresAt: Date | null
}

export class CreateApiKeyUseCase {
  constructor(private apiKeyRepo: IApiKeyRepository) {}

  async execute(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
    const rawKey = 'gtd_' + randomBytes(32).toString('hex')
    const prefix = rawKey.substring(0, KEY_PREFIX_DISPLAY)
    const keyHash = await bcrypt.hash(rawKey, 10)

    const record = await this.apiKeyRepo.create({
      name: input.name,
      keyHash,
      prefix,
      userId: input.userId,
      expiresAt: input.expiresAt,
    })

    return {
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      key: rawKey,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    }
  }
}
