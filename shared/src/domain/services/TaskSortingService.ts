import { GenericTaskWithSubtasks } from '../entities/TaskTypes'
import { TaskPriorityService } from './TaskPriorityService'
import { TaskEntity } from '../entities/TaskEntity'

/**
 * Task sorting system implementation
 * Uses domain services for business logic while providing sorting methods
 */
export class TaskSortingService {
  /**
   * Parse date string and normalize to UTC at midnight
   * Delegates to domain service for consistency
   */
  static parseAndNormalizeDate(dateInput: string | Date): Date {
    return TaskPriorityService.normalizeDate(dateInput)
  }

  /**
    * Sort tasks according to the priority system using domain service
    */
  static sortTasksByPriority<TDate extends string | Date>(
    tasks: TaskEntity<TDate>[]
  ): TaskEntity<TDate>[] {
    if (!tasks || tasks.length === 0) return []

    const dateContext = TaskPriorityService.createDateContext()

    return [...tasks]
      .sort((a, b) => TaskPriorityService.compareTasksPriority(a['task'], b['task'], dateContext))
      .map((task) => {
        // Create a new TaskEntity with sorted subtasks
        const rawTask = task['task']
        const sortedSubtasks = TaskSortingService.sortSubtasksByPriorityForEntities(rawTask.subtasks)
        return new TaskEntity({ ...rawTask, subtasks: sortedSubtasks })
      })
  }

  /**
    * Sort tasks according to the priority system (raw task objects)
    */
  static sortTasksByPriorityRaw<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    const dateContext = TaskPriorityService.createDateContext()

    return [...tasks]
      .sort((a, b) => TaskPriorityService.compareTasksPriority(a, b, dateContext))
      .map((task) => ({
        ...task,
        subtasks: TaskSortingService.sortSubtasksByPriorityRaw(task.subtasks)
      }))
  }

  /**
    * Sort subtasks by points using domain service (for TaskEntity)
    */
  private static sortSubtasksByPriorityForEntities<TDate extends string | Date>(
    subtasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    return [...subtasks]
      .sort((a, b) => TaskPriorityService.compareByPoints(a, b))
      .map((subtask) => ({
        ...subtask,
        subtasks: TaskSortingService.sortSubtasksByPriorityForEntities(subtask.subtasks)
      }))
  }

  /**
    * Sort subtasks by points using domain service (for raw task objects)
    */
  static sortSubtasksByPriorityRaw<TDate extends string | Date>(
    subtasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    return [...subtasks]
      .sort((a, b) => TaskPriorityService.compareByPoints(a, b))
      .map((subtask) => ({
        ...subtask,
        subtasks: TaskSortingService.sortSubtasksByPriorityRaw(subtask.subtasks)
      }))
  }

  /**
    * Sort subtasks by points using domain service
    */
  static sortSubtasksByPriority<TDate extends string | Date>(
    subtasks: TaskEntity<TDate>[]
  ): TaskEntity<TDate>[] {
    return [...subtasks]
      .sort((a, b) => TaskPriorityService.compareByPoints(a['task'], b['task']))
      .map((subtask) => {
        // Create new TaskEntity with sorted subtasks
        const rawTask = subtask['task']
        const sortedSubtasks = TaskSortingService.sortSubtasksByPriorityForEntities(rawTask.subtasks)
        return new TaskEntity({ ...rawTask, subtasks: sortedSubtasks })
      })
  }

  /**
    * Compare two tasks by points (higher points = higher priority)
    * Delegates to domain service
    */
  static compareByPoints<TDate extends string | Date>(
    a: TaskEntity<TDate> | GenericTaskWithSubtasks<TDate>,
    b: TaskEntity<TDate> | GenericTaskWithSubtasks<TDate>
  ): number {
    // Extract raw task data for comparison
    const taskA = a instanceof TaskEntity ? a['task'] : a
    const taskB = b instanceof TaskEntity ? b['task'] : b
    return TaskPriorityService.compareByPoints(taskA, taskB)
  }

  /**
   * Sort by due date (ascending)
   */
  static sortByDueDate<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    return [...tasks].sort((a, b) => {
      // Tasks without dates go last
      if (!a.plannedDate && b.plannedDate) return 1
      if (a.plannedDate && !b.plannedDate) return -1
      if (!a.plannedDate && !b.plannedDate) return 0

      // Compare dates
      const dateA = new Date(a.plannedDate as string | number | Date)
      const dateB = new Date(b.plannedDate as string | number | Date)
      return dateA.getTime() - dateB.getTime()
    })
  }

  /**
    * Sort by creation date (newest first)
    */
  static sortByCreationDate<TDate extends string | Date>(
    tasks: (TaskEntity<TDate> | GenericTaskWithSubtasks<TDate>)[]
  ): (TaskEntity<TDate> | GenericTaskWithSubtasks<TDate>)[] {
    return [...tasks].sort((a, b) => {
      const taskA = a instanceof TaskEntity ? a['task'] : a
      const taskB = b instanceof TaskEntity ? b['task'] : b
      const dateA = new Date(taskA.createdAt as string | number | Date)
      const dateB = new Date(taskB.createdAt as string | number | Date)
      return dateB.getTime() - dateA.getTime()
    })
  }

  /**
    * Sort by completion date (newest first)
    */
  static sortByCompletionDate<TDate extends string | Date>(
    tasks: (TaskEntity<TDate> | GenericTaskWithSubtasks<TDate>)[]
  ): (TaskEntity<TDate> | GenericTaskWithSubtasks<TDate>)[] {
    return [...tasks].sort((a, b) => {
      const taskA = a instanceof TaskEntity ? a['task'] : a
      const taskB = b instanceof TaskEntity ? b['task'] : b

      // Incomplete tasks go first
      if (!taskA.completedAt && taskB.completedAt) return -1
      if (taskA.completedAt && !taskB.completedAt) return 1
      if (!taskA.completedAt && !taskB.completedAt) return 0

      // Compare completion dates
      const dateA = new Date(taskA.completedAt as string | number | Date)
      const dateB = new Date(taskB.completedAt as string | number | Date)
      return dateB.getTime() - dateA.getTime()
    })
  }

  /**
   * Sort alphabetically by name
   */
  static sortByName<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    return [...tasks].sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Sort by importance (highest first)
   */
  static sortByImportance<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    return [...tasks].sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance
      }
      // Secondary sort by points
      return b.points - a.points
    })
  }

  /**
   * Sort by complexity (simplest first)
   */
  static sortByComplexity<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    return [...tasks].sort((a, b) => {
      if (a.complexity !== b.complexity) {
        return a.complexity - b.complexity
      }
      // Secondary sort by points (highest first)
      return b.points - a.points
    })
  }

  /**
   * Get tasks due in a specific time range
   */
  static getTasksDueInRange<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[],
    startDate: Date,
    endDate: Date
  ): GenericTaskWithSubtasks<TDate>[] {
    return tasks.filter(task => {
      if (!task.plannedDate) return false

      const plannedDate = this.parseAndNormalizeDate(task.plannedDate)
      return plannedDate >= startDate && plannedDate <= endDate
    })
  }

  /**
   * Get overdue tasks
   */
  static getOverdueTasks<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    const dateContext = TaskPriorityService.createDateContext()

    return tasks.filter(task =>
      TaskPriorityService.isOverdueTask(task, dateContext)
    )
  }

  /**
   * Get tasks due today
   */
  static getTodayTasks<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    const dateContext = TaskPriorityService.createDateContext()

    return tasks.filter(task =>
      TaskPriorityService.isTodayTask(task, dateContext)
    )
  }

  /**
   * Get tasks due tomorrow
   */
  static getTomorrowTasks<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    const dateContext = TaskPriorityService.createDateContext()

    return tasks.filter(task =>
      TaskPriorityService.isTomorrowTask(task, dateContext)
    )
  }

  /**
   * Get collected tasks (high priority without dates)
   */
  static getCollectedTasks<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): GenericTaskWithSubtasks<TDate>[] {
    const dateContext = TaskPriorityService.createDateContext()

    return tasks.filter(task =>
      TaskPriorityService.isCollectedTask(task, dateContext)
    )
  }
}