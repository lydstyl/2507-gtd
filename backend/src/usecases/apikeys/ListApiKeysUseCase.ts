import { IApiKeyRepository } from '../../interfaces/repositories/ApiKeyRepository'

export class ListApiKeysUseCase {
  constructor(private apiKeyRepo: IApiKeyRepository) {}

  async execute(userId: string) {
    return this.apiKeyRepo.findByUserId(userId)
  }
}
