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