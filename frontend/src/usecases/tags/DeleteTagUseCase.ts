import { BaseUseCase } from '../base/UseCase'
import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { OperationResult } from '../../domain/types/Common'

export interface DeleteTagRequest {
  id: string
  force?: boolean // Delete even if used by tasks
}

export interface DeleteTagResponse {
  deletedTagId: string
  message: string
}

export class DeleteTagUseCase extends BaseUseCase<DeleteTagRequest, DeleteTagResponse> {
  constructor(
    private tagRepository: TagRepository,
    private taskRepository: TaskRepository
  ) {
    super()
  }

  async execute(request: DeleteTagRequest): Promise<OperationResult<DeleteTagResponse>> {
    return this.handleAsync(async () => {
      // Validate input
      if (!request.id || request.id.trim().length === 0) {
        throw new Error('Tag ID is required')
      }

      // Check if tag exists
      const tag = await this.tagRepository.getById(request.id)
      if (!tag) {
        throw new Error('Tag not found')
      }

      // Check if tag is being used by tasks (if force is not enabled)
      if (!request.force) {
        const tasksWithTag = await this.taskRepository.getByFilters({
          tagIds: [request.id]
        })

        if (tasksWithTag.length > 0) {
          throw new Error(
            `Cannot delete tag "${tag.name}" because it is used by ${tasksWithTag.length} task(s). Use force delete to remove anyway.`
          )
        }
      }

      // Perform the deletion
      await this.tagRepository.delete(request.id)

      return {
        deletedTagId: request.id,
        message: `Tag "${tag.name}" has been deleted successfully`
      }
    }, 'Failed to delete tag')
  }
}

export interface GetTagByIdRequest {
  id: string
}

export interface GetTagByIdResponse {
  tag: any
}

export class GetTagByIdUseCase extends BaseUseCase<GetTagByIdRequest, GetTagByIdResponse> {
  constructor(private tagRepository: TagRepository) {
    super()
  }

  async execute(request: GetTagByIdRequest): Promise<OperationResult<GetTagByIdResponse>> {
    return this.handleAsync(async () => {
      // Validate input
      if (!request.id || request.id.trim().length === 0) {
        throw new Error('Tag ID is required')
      }

      // Fetch the tag
      const tag = await this.tagRepository.getById(request.id)
      if (!tag) {
        throw new Error('Tag not found')
      }

      return {
        tag
      }
    }, 'Failed to fetch tag')
  }
}