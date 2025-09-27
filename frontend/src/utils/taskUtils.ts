export type TaskCategory = 'collected' | 'overdue' | 'today' | 'tomorrow' | 'no-date' | 'future'

export const getPriorityColor = (importance: number): string => {
  switch (importance) {
    case 1:
      return 'bg-black'
    case 2:
      return 'bg-gray-800'
    case 3:
      return 'bg-gray-600'
    case 4:
      return 'bg-gray-400'
    case 5:
      return 'bg-gray-200'
    default:
      return 'bg-gray-300'
  }
}

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return 'Date invalide'
    }

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
    const tomorrowOnly = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate()
    )

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "Aujourd'hui"
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
      return 'Demain'
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  } catch (error) {
    console.error('Erreur de formatage de date:', error)
    return 'Date invalide'
  }
}

export const isOverdue = (dateString: string): boolean => {
  try {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  } catch {
    return false
  }
}

export const isDueDateUrgent = (dateString: string): boolean => {
  try {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate date + 3 days from today
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    // Check if due date is within the next 3 days (including today)
    return date <= threeDaysFromNow
  } catch {
    return false
  }
}

export const getDayOfWeek = (dateString: string): number => {
  try {
    const date = new Date(dateString)
    return date.getDay()
  } catch {
    return -1
  }
}

export const getDateIndicator = (dateString: string) => {
  const dayOfWeek = getDayOfWeek(dateString)

  if (dayOfWeek === 3) {
    return {
      icon: '🌿',
      tooltip: 'Mercredi',
      className: 'text-green-600'
    }
  } else if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      icon: '🏖️',
      tooltip: 'Week-end',
      className: 'text-orange-600'
    }
  }

  return null
}

export const getTaskCategory = (task: { points: number; importance: number; complexity: number; plannedDate?: string | Date | null; dueDate?: string | Date | null }): TaskCategory => {
  // Parse and normalize date like in backend TaskSorting (UTC-based)
  const parseDate = (dateInput: string | Date): Date => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  }

  // Determine effective date: use due date if urgent, otherwise planned date (mirrors domain logic)
  const now = new Date()
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1))
  const dayAfterTomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 2))

  // Check if due date is urgent (within 2 days from today)
  const isDueDateUrgent = (dueDate: string | Date): boolean => {
    try {
      const date = parseDate(dueDate)
      return date < dayAfterTomorrow
    } catch {
      return false
    }
  }

  // Get effective date: use due date if urgent, otherwise planned date
  let effectiveDate: Date | null = null
  if (task.dueDate && isDueDateUrgent(task.dueDate)) {
    effectiveDate = parseDate(task.dueDate)
  } else if (task.plannedDate) {
    effectiveDate = parseDate(task.plannedDate)
  }

  // 1. Collected tasks (without effective date) — new default tasks (importance=0, complexity=3) OR high priority tasks (500+ points)
  if (!effectiveDate) {
    const isNewDefaultTask = task.importance === 0 && task.complexity === 3
    const isHighPriorityTask = task.points >= 500
    if (isNewDefaultTask || isHighPriorityTask) {
      return 'collected'
    }
    return 'no-date'
  }

  // 2. Overdue tasks
  if (effectiveDate < today) {
    return 'overdue'
  }

  // 3. Today tasks
  if (effectiveDate.getTime() === today.getTime()) {
    return 'today'
  }

  // 4. Tomorrow tasks
  if (effectiveDate.getTime() === tomorrow.getTime()) {
    return 'tomorrow'
  }

  // 5. Future tasks (day+2 or more)
  if (effectiveDate >= dayAfterTomorrow) {
    return 'future'
  }

  // Fallback
  return 'no-date'
}

export const getTaskCategoryStyle = (category: TaskCategory) => {
  const styles = {
    collected: {
      borderColor: 'border-l-purple-500',
      backgroundColor: 'bg-white',
      label: 'Collecté',
      textColor: 'text-purple-700'
    },
    overdue: {
      borderColor: 'border-l-red-500',
      backgroundColor: 'bg-red-50',
      label: 'En retard',
      textColor: 'text-red-700'
    },
    today: {
      borderColor: 'border-l-blue-500',
      backgroundColor: 'bg-blue-50',
      label: "Aujourd'hui",
      textColor: 'text-blue-700'
    },
    tomorrow: {
      borderColor: 'border-l-green-500',
      backgroundColor: 'bg-green-50',
      label: 'Demain',
      textColor: 'text-green-700'
    },
    'no-date': {
      borderColor: 'border-l-gray-400',
      backgroundColor: 'bg-white',
      label: 'Sans date',
      textColor: 'text-gray-600'
    },
    future: {
      borderColor: 'border-l-amber-500',
      backgroundColor: 'bg-amber-50',
      label: 'Futur',
      textColor: 'text-amber-700'
    }
  }

  return styles[category]
}