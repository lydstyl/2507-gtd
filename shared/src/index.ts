/**
 * Public API exports for the shared GTD domain package
 */

// Entities
export { TaskEntity } from './domain/entities/TaskEntity'
export { TagEntity } from './domain/entities/TagEntity'
export { UserEntity } from './domain/entities/UserEntity'

// Types and interfaces
export * from './domain/entities/TaskTypes'
export * from './domain/entities/TagTypes'

// Domain services
export { TaskPriorityService } from './domain/services/TaskPriorityService'
export { TaskCategoryService } from './domain/services/TaskCategoryService'
export { TaskSortingService } from './domain/services/TaskSortingService'
export { TaskValidationService } from './domain/services/TaskValidationService'
export { TagValidationService } from './domain/services/TagValidationService'
export { CsvService } from './domain/services/CsvService'

// Constants and business rules
export * from './domain/constants/BusinessRules'
export * from './domain/constants/ValidationRules'

// Utilities
export * from './domain/utils/DateUtils'
export * from './domain/utils/TaskDisplayUtils'

// Domain errors
export * from './domain/errors'

// Use case base classes and validation
export * from './domain/types/OperationResult'
export { BaseUseCase } from './domain/usecases/BaseUseCase'
export { SharedUseCaseValidator } from './domain/usecases/SharedUseCaseValidator'

// Repository contracts and types
export * from './domain/repositories/RepositoryTypes'
export * from './domain/repositories/TaskRepositoryContract'
export * from './domain/repositories/TagRepositoryContract'

// Utility patterns
export * from './domain/utils/patterns/PaginationUtils'
export { SortingUtils, type SortDirection, type SortField, type SortOptions as SortingOptions } from './domain/utils/patterns/SortingUtils'
export * from './domain/utils/patterns/FilterUtils'

// Business workflows
export * from './domain/services/workflows/TaskWorkflowService'
export { BulkOperationService, type BulkOperationResult as BulkResult, type BulkUpdateRequest } from './domain/services/workflows/BulkOperationService'

// Cross-cutting concerns
export * from './domain/patterns/Logger'
export * from './domain/patterns/EventBus'

// Enhanced validation
export * from './domain/services/validation/ValidationComposer'