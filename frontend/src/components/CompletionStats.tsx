import { useState, useEffect } from 'react'
import type { CompletionStats } from '../types/task'
import { api } from '../utils/api'

export function CompletionStats() {
  const [stats, setStats] = useState<CompletionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await api.getCompletionStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading completion stats:', error)
      setError('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDays(newExpanded)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "Aujourd'hui"
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
    }
  }

  const formatWeekDate = (weekStartStr: string) => {
    const weekStart = new Date(weekStartStr)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    return `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques de completion</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques de completion</h3>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Statistiques de completion</h3>

      {/* Daily Completions - Last 7 Days */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-800 mb-4">Tâches terminées - 7 derniers jours</h4>
        <div className="space-y-2">
          {stats.dailyCompletions.map((day) => (
            <div key={day.date} className="border border-gray-200 rounded-lg p-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleDayExpansion(day.date)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">
                    {formatDate(day.date)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    day.count > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {day.count} tâche{day.count !== 1 ? 's' : ''}
                  </span>
                </div>
                {day.count > 0 && (
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedDays.has(day.date) ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>

              {expandedDays.has(day.date) && day.tasks.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-green-200">
                  <div className="space-y-1">
                    {day.tasks.map((task) => (
                      <div key={task.id} className="text-sm text-gray-600 flex items-center space-x-2">
                        <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{task.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Completions - Last 8 Weeks */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-4">Progression hebdomadaire - 8 dernières semaines</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.weeklyCompletions.map((week, index) => (
            <div
              key={week.weekStart}
              className="bg-gray-50 rounded-lg p-3 text-center"
            >
              <div className="text-xs text-gray-500 mb-1">
                Semaine {formatWeekDate(week.weekStart)}
              </div>
              <div className={`text-lg font-semibold ${
                week.count > 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {week.count}
              </div>
              <div className="text-xs text-gray-500">
                tâche{week.count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.dailyCompletions.reduce((sum, day) => sum + day.count, 0)}
            </div>
            <div className="text-sm text-gray-600">Cette semaine</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.weeklyCompletions.reduce((sum, week) => sum + week.count, 0)}
            </div>
            <div className="text-sm text-gray-600">8 dernières semaines</div>
          </div>
        </div>
      </div>
    </div>
  )
}