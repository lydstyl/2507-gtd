import { useMemo, useState, useEffect } from 'react'
import { api } from '../utils/api'
import type { Task } from '../types/task'

interface DuplicateMatch {
  task: Task
  matchedWords: string[]
}

/**
 * Custom hook to detect duplicate words in task names
 * @param taskName - The current task name being typed
 * @returns Array of tasks with matching words
 */
export function useDuplicateWordDetection(taskName: string): DuplicateMatch[] {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const tasksData = await api.getTasks()
      setTasks(tasksData)
    } catch (err) {
      console.error('Erreur lors du chargement des tâches:', err)
    }
  }

  const duplicateMatches = useMemo(() => {
    if (!taskName || taskName.trim().length < 3) {
      return []
    }

    // Extract words from current task name (more than 3 letters, ignore common words)
    const commonWords = new Set([
      'the',
      'and',
      'for',
      'with',
      'une',
      'des',
      'les',
      'dans',
      'pour',
      'sur'
    ])

    const currentWords = taskName
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.has(word))

    if (currentWords.length === 0) {
      return []
    }

    // Find tasks that contain any of these words (exclude completed tasks)
    const matches: DuplicateMatch[] = []

    tasks.forEach((task) => {
      // Skip completed tasks
      if (task.completedAt) return

      const taskWords = task.name.toLowerCase().split(/\s+/)
      const matchedWords = currentWords.filter((word) =>
        taskWords.some((taskWord) => taskWord.includes(word))
      )

      if (matchedWords.length > 0) {
        matches.push({ task, matchedWords })
      }
    })

    return matches
  }, [taskName, tasks])

  return duplicateMatches
}
