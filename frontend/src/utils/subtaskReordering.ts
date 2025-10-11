import type { Task } from '../types/task'

/**
 * Calculate position for a subtask based on its new position in the list
 * Position is used for custom ordering of subtasks (via drag & drop)
 *
 * @param subtasks - Array of subtasks in current display order (BEFORE the move)
 * @param oldIndex - The old position of the dragged task
 * @param newIndex - The new position of the dragged task
 * @returns The new position value for the dragged task
 */
export function calculateReorderedPosition(
  subtasks: Task[],
  oldIndex: number,
  newIndex: number
): number {
  // If moving to the same position, no change needed
  if (oldIndex === newIndex) {
    return subtasks[oldIndex].position
  }

  // Create a copy of the array with the task removed (to simulate the move)
  const subtasksWithoutDragged = subtasks.filter((_, index) => index !== oldIndex)

  // Moving to first position (highest position value)
  if (newIndex === 0) {
    const nextTask = subtasksWithoutDragged[0]
    if (nextTask) {
      return nextTask.position > 0 ? nextTask.position + 100 : 10000
    }
    return 10000
  }

  // Moving to last position (lowest position value)
  if (newIndex === subtasksWithoutDragged.length) {
    const prevTask = subtasksWithoutDragged[subtasksWithoutDragged.length - 1]
    if (prevTask) {
      const basePosition = prevTask.position > 0 ? prevTask.position : 10000
      return Math.max(1, basePosition - 100)
    }
    return 1
  }

  // Moving between two tasks
  // The task will be inserted at newIndex, so:
  // - taskAbove is at newIndex-1 (in the array without the dragged task)
  // - taskBelow is at newIndex (in the array without the dragged task)
  const taskAbove = subtasksWithoutDragged[newIndex - 1]
  const taskBelow = subtasksWithoutDragged[newIndex]

  // Calculate midpoint between the two tasks
  const positionAbove = taskAbove.position > 0 ? taskAbove.position : 10000
  const positionBelow = taskBelow.position > 0 ? taskBelow.position : 1

  // If there's enough space between the two tasks, use midpoint
  if (positionAbove - positionBelow > 1) {
    return Math.floor((positionAbove + positionBelow) / 2)
  }

  // If not enough space, add buffer above
  return positionAbove + 50
}