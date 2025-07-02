import {
  Task,
  TaskWithSubtasks,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters
} from '../../domain/entities/Task'

export interface TaskRepository {
  /**
   * Crée une tâche pour un utilisateur, avec dueDate optionnelle
   */
  create(data: CreateTaskData): Promise<TaskWithSubtasks>
  findById(id: string): Promise<TaskWithSubtasks | null>
  findAll(filters?: TaskFilters): Promise<TaskWithSubtasks[]>
  /**
   * Met à jour une tâche (dueDate et userId gérés)
   */
  update(id: string, data: UpdateTaskData): Promise<TaskWithSubtasks>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
}
