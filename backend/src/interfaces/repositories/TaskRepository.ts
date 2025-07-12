import {
  Task,
  TaskWithSubtasks,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters as BaseTaskFilters
} from '../../domain/entities/Task'
import { TaskWithTags } from '../../services/csvService'

export interface TaskFilters extends BaseTaskFilters {
  // userId est maintenant obligatoire dans BaseTaskFilters
}

export interface TaskRepository {
  /**
   * Crée une tâche pour un utilisateur, avec dueDate optionnelle
   */
  create(data: CreateTaskData): Promise<TaskWithSubtasks>
  findById(id: string): Promise<TaskWithSubtasks | null>
  findAll(filters: TaskFilters): Promise<TaskWithSubtasks[]>
  /**
   * Récupère uniquement les tâches racines (parentId = null) avec leurs sous-tâches imbriquées
   * Utilisé pour la TaskListPage
   */
  findAllRootTasks(filters: TaskFilters): Promise<TaskWithSubtasks[]>
  /**
   * Récupère toutes les tâches d'un utilisateur avec leurs tags pour l'export CSV
   */
  getAllTasksWithTags(userId: string): Promise<TaskWithTags[]>
  /**
   * Met à jour une tâche (dueDate et userId gérés)
   */
  update(id: string, data: UpdateTaskData): Promise<TaskWithSubtasks>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
  deleteAllByUserId(userId: string): Promise<void>
}
