import {
  Task,
  TaskWithSubtasks,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters
} from '../../domain/entities/Task'

export interface TaskRepository {
  create(data: CreateTaskData): Promise<TaskWithSubtasks>
  findById(id: string): Promise<TaskWithSubtasks | null>
  findAll(filters?: TaskFilters): Promise<TaskWithSubtasks[]>
  update(id: string, data: UpdateTaskData): Promise<TaskWithSubtasks>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
}
