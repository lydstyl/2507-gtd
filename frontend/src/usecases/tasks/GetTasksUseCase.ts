import { BaseUseCase } from '../base/UseCase'
import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskEntity } from '../../domain/entities/Task'
import { TaskSortingService } from '../../domain/services/TaskSortingService'
import { TaskFilters } from '../../domain/types/TaskTypes'
import { OperationResult } from '../../domain/types/Common'

export interface GetTasksRequest {
  includeSubtasks?: boolean
  rootOnly?: boolean
  filters?: TaskFilters
  sort?: boolean
}

export interface GetTasksResponse {
  tasks: TaskEntity[]
  totalCount: number
}

export class GetTasksUseCase extends BaseUseCase<GetTasksRequest, GetTasksResponse> {
  constructor(private taskRepository: TaskRepository) {
    super()
  }

  async execute(request: GetTasksRequest = {}): Promise<OperationResult<GetTasksResponse>> {
    return this.handleAsync(async () => {
      let tasks: any[]

      // Determine which repository method to use
      if (request.rootOnly) {
        tasks = await this.taskRepository.getRootTasks()
      } else if (request.includeSubtasks) {
        tasks = await this.taskRepository.getAllWithSubtasks()
      } else if (request.filters) {
        tasks = await this.taskRepository.getByFilters(request.filters)
      } else {
        tasks = await this.taskRepository.getAll()
      }

      // Convert to TaskEntity instances
      let taskEntities = tasks.map(task => new TaskEntity(task))

      // Apply sorting if requested (default: true)
      if (request.sort !== false) {
        taskEntities = TaskSortingService.sortTasksByPriority(taskEntities)
      }

      return {
        tasks: taskEntities,
        totalCount: taskEntities.length
      }
    }, 'Failed to fetch tasks')
  }
}