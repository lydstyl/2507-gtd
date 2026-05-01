import { randomBytes } from 'crypto'
import bcrypt from 'bcrypt'
import { IApiKeyRepository } from '../../interfaces/repositories/ApiKeyRepository'
import { RevokeApiKeyUseCase } from './RevokeApiKeyUseCase'
import { CreateApiKeyResult } from './CreateApiKeyUseCase'

const KEY_PREFIX_DISPLAY = 12

export class RegenerateApiKeyUseCase {
  constructor(
    private apiKeyRepo: IApiKeyRepository,
    private revokeUseCase: RevokeApiKeyUseCase
  ) {}

  async execute(id: string, userId: string): Promise<CreateApiKeyResult | null> {
    // Get the existing key to retrieve its name
    const existing = await this.apiKeyRepo.findById(id)
    if (!existing || existing.userId !== userId) return null

    // Revoke the old key
    await this.revokeUseCase.execute(id, userId)

    // Create a new key with the same name
    const rawKey = 'gtd_' + randomBytes(32).toString('hex')
    const prefix = rawKey.substring(0, KEY_PREFIX_DISPLAY)
    const keyHash = await bcrypt.hash(rawKey, 10)

    const record = await this.apiKeyRepo.create({
      name: existing.name,
      keyHash,
      prefix,
      userId,
      expiresAt: existing.expiresAt,
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
