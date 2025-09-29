import { Tag, CreateTagData, UpdateTagData } from '../../domain/entities/Tag'
import { FrontendTagRepositoryContract } from '@gtd/shared'

/**
 * Frontend tag repository interface
 * Extends shared contract with frontend-specific types (string dates)
 */
export interface TagRepository extends FrontendTagRepositoryContract<string> {
  // All methods inherited from FrontendTagRepositoryContract
  // The interface is now aligned with the shared contract
}