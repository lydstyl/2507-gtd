import { Tag, CreateTagData, UpdateTagData } from '../../domain/entities/Tag'
import { BackendTagRepositoryContract } from '@gtd/shared'

/**
 * Backend tag repository interface
 * Extends shared contract with backend-specific types (Date objects)
 */
export interface TagRepository extends BackendTagRepositoryContract<Date> {
  // All methods inherited from BackendTagRepositoryContract
  // The interface is now aligned with the shared contract
}
