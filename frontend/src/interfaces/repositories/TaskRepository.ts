import { Task, CreateTaskData, UpdateTaskData } from '../../domain/entities/Task'
import { TaskFilters } from '../../domain/types/TaskTypes'

export interface TaskRepository {
  // Query operations
  getAll(): Promise<Task[]>
  getAllWithSubtasks(): Promise<Task[]>
  getRootTasks(): Promise<Task[]>
  getById(id: string): Promise<Task | null>
  getByFilters(filters: TaskFilters): Promise<Task[]>
  getCompletedTasks(): Promise<Task[]>

  // Command operations
  create(data: CreateTaskData): Promise<Task>
  update(id: string, data: UpdateTaskData): Promise<Task>
  updateNote(id: string, note: string): Promise<Task>
  deleteNote(id: string): Promise<Task>
  delete(id: string): Promise<void>
  deleteAll(): Promise<void>
  workedOnTask(id: string): Promise<Task>

  // Bulk operations
  createMany(tasks: CreateTaskData[]): Promise<Task[]>
  updateMany(updates: Array<{ id: string; data: UpdateTaskData }>): Promise<Task[]>
  deleteMany(ids: string[]): Promise<void>

  // Import/Export operations
  export(): Promise<Blob>
  import(csvContent: string): Promise<{ message: string; importedCount: number; errors: string[] }>
}