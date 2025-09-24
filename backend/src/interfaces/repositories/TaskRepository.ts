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

export interface CompletionStats {
  dailyCompletions: { date: string; count: number; tasks: { id: string; name: string }[] }[]
  weeklyCompletions: { weekStart: string; count: number }[]
}

export interface TaskRepository {
  /**
   * Crée une tâche pour un utilisateur, avec plannedDate optionnelle
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
   * Met à jour une tâche (plannedDate et userId gérés)
   */
  update(id: string, data: UpdateTaskData): Promise<TaskWithSubtasks>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
  deleteAllByUserId(userId: string): Promise<void>
  /**
   * Marque une tâche comme terminée
   */
  markAsCompleted(id: string, userId: string): Promise<TaskWithSubtasks>
  /**
   * Récupère les statistiques de completion pour un utilisateur
   */
  getCompletionStats(userId: string): Promise<CompletionStats>
  /**
   * Récupère les tâches terminées pour une période donnée
   */
  getCompletedTasks(userId: string, startDate: Date, endDate: Date): Promise<TaskWithSubtasks[]>
  /**
   * Supprime les tâches terminées plus anciennes que la date spécifiée
   */
  deleteOldCompletedTasks(cutoffDate: Date): Promise<number>
}
