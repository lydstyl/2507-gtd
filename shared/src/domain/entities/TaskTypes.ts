/**
 * Shared types and enums for the GTD domain
 */

export type TaskStatus = 'brouillon' | 'pour_ia' | 'collecte' | 'pret' | 'un_jour_peut_etre' | 'ia_en_cours' | 'ia_arretee' | 'termine_par_ia'

export type TaskCategory = 'brouillon' | 'pour-ia' | 'collected' | 'ia-en-cours' | 'ia-arretee' | 'pret-overdue' | 'pret-today' | 'pret-tomorrow' | 'pret-no-date' | 'pret-future' | 'un-jour' | 'termine-par-ia'

export interface DateContext {
  today: Date
  tomorrow: Date
  dayAfterTomorrow: Date
}

/**
 * Generic Task interface that works with both Date objects (backend) and strings (frontend)
 */
export interface TaskBase<TDate = Date | string> {
  id: string
  name: string
  link?: string
  note?: string
  /**
   * True when the task has a note. Present in LIST responses (where `note`
   * itself is omitted to keep the payload small) so the UI can still render
   * a "has note" indicator without fetching the full task.
   */
  hasNote?: boolean
  importance: number
  complexity: number
  position: number
  status: TaskStatus
  plannedDate?: TDate
  dueDate?: TDate
  parentId?: string
  userId: string
  isCompleted: boolean
  completedAt?: TDate
  /**
   * Activité agent en cours (tâche `ia_en_cours`) : texte court posé par
   * l'agent à chaque étape (« lit la source », « teste l'API »…), complété
   * par un heartbeat wrapper (60 s) si l'agent ne le met pas à jour.
   * `activityAt` = horodatage serveur du dernier update (le backend le pose,
   * l'agent n'envoie que le texte).
   */
  activity?: string
  activityAt?: TDate
  /** Agent qui travaille la tâche (statut `ia_en_cours`) : posé par le
   *  dispatch à la prise (« Luna », « Harry »…), effacé en quittant le statut. */
  agent?: string
  createdAt: TDate
  updatedAt: TDate
}

/**
 * Generic Task with subtasks
 */
export interface TaskWithSubtasks<TDate = Date | string> extends TaskBase<TDate> {
  subtasks: TaskWithSubtasks<TDate>[]
  tags: TagBase<TDate>[]
}

/**
 * Generic Tag interface
 */
export interface TagBase<TDate = Date | string> {
   id: string
   name: string
   color?: string
   userId: string
   createdAt: TDate
   updatedAt: TDate
}

/**
 * Generic User interface
 */
export interface UserBase<TDate = Date | string> {
   id: string
   email: string
   password: string
   createdAt: TDate
   updatedAt: TDate
   tasks?: any[]
   tags?: any[]
}

/**
 * Type aliases for specific contexts
 */

// Backend types (using Date objects from database)
export type BackendTask = TaskBase<Date>
export type BackendTaskWithSubtasks = TaskWithSubtasks<Date>
export type BackendTag = TagBase<Date>
export type BackendUser = UserBase<Date>

// Frontend types (using string dates from JSON API)
export type FrontendTask = TaskBase<string>
export type FrontendTaskWithSubtasks = TaskWithSubtasks<string>
export type FrontendTag = TagBase<string>
export type FrontendUser = UserBase<string>

// Generic types for domain services
export type GenericTask<TDate = Date | string> = TaskBase<TDate>
export type GenericTaskWithSubtasks<TDate = Date | string> = TaskWithSubtasks<TDate>

/**
 * Data for creating a new task
 */
export interface CreateTaskData {
  name: string
  link?: string
  note?: string
  importance?: number
  complexity?: number
  status?: TaskStatus
  parentId?: string
  tagIds?: string[]
  userId: string
  plannedDate?: Date | string
  dueDate?: Date | string
  isCompleted?: boolean
}

/**
 * Data for updating an existing task
 */
export interface UpdateTaskData {
  name?: string
  link?: string
  note?: string
  importance?: number
  complexity?: number
  status?: TaskStatus
  position?: number
  parentId?: string
  tagIds?: string[]
  userId?: string
  plannedDate?: Date | string | null
  dueDate?: Date | string | null
  isCompleted?: boolean
  completedAt?: Date | string | null
  activity?: string | null
  agent?: string | null
}

/**
 * Filters for querying tasks
 */
export interface TaskFilters {
  userId: string
  parentId?: string
  tagIds?: string[]
  importance?: number
  complexity?: number
  search?: string
  status?: 'active' | 'completed' | 'all'
  plannedDateFrom?: Date | string
  plannedDateTo?: Date | string
  dueDateFrom?: Date | string
  dueDateTo?: Date | string
  priority?: number
  searchQuery?: string
}