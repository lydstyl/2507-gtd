import { IApiKeyRepository } from '../../interfaces/repositories/ApiKeyRepository'

export class RevokeApiKeyUseCase {
  constructor(private apiKeyRepo: IApiKeyRepository) {}

  async execute(id: string, userId: string): Promise<boolean> {
    return this.apiKeyRepo.delete(id, userId)
  }
}
