import { useState, useRef, useEffect } from 'react'
import { TaskCard } from './TaskCard'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import type { Task } from '../types/task'

interface SwipeableTaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
  onAssignParent?: (task: Task) => void
  onEditNote?: (task: Task) => void
  onMarkCompleted?: (taskId: string) => void
  onWorkedOn?: (taskId: string) => void
  level?: number
  isEven?: boolean
  isSelected?: boolean
  onSelectTask?: (taskId: string) => void
  selectedTaskId?: string
  onQuickAction?: (taskId: string, action: string) => void
  onPin?: (taskId: string) => void
  isPinned?: boolean
}

interface SwipeState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  isDragging: boolean
  startTime: number
}

const SWIPE_THRESHOLD = 100 // minimum distance for swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3 // minimum velocity (px/ms)
const MAX_VERTICAL_DEVIATION = 50 // max vertical movement allowed for horizontal swipe

export function SwipeableTaskCard(props: SwipeableTaskCardProps) {
  const [swipeState, setSwipeState] = useState<SwipeState | null>(null)
  const [showSwipeIndicator, setShowSwipeIndicator] = useState<'complete' | 'delete' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const haptic = useHapticFeedback()

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: false,
      startTime: Date.now()
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeState) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - swipeState.startX
    const deltaY = Math.abs(touch.clientY - swipeState.startY)

    // Prevent scrolling if horizontal swipe is detected
    if (Math.abs(deltaX) > 10 && deltaY < MAX_VERTICAL_DEVIATION) {
      e.preventDefault()
    }

    setSwipeState(prev => prev ? {
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: Math.abs(deltaX) > 10
    } : null)

    // Update visual feedback and haptic feedback
    if (Math.abs(deltaX) > 20 && deltaY < MAX_VERTICAL_DEVIATION) {
      const newIndicator = deltaX > 0 ? 'complete' : 'delete'
      if (showSwipeIndicator !== newIndicator) {
        haptic.swipeAction() // Haptic feedback when swipe direction is detected
        setShowSwipeIndicator(newIndicator)
      }
    } else {
      setShowSwipeIndicator(null)
    }

    // Apply transform to card
    if (cardRef.current && Math.abs(deltaX) > 5) {
      const clampedDelta = Math.max(-150, Math.min(150, deltaX))
      cardRef.current.style.transform = `translateX(${clampedDelta}px)`
      cardRef.current.style.transition = 'none'
    }
  }

  const handleTouchEnd = () => {
    if (!swipeState || !cardRef.current) return

    const deltaX = swipeState.currentX - swipeState.startX
    const deltaY = Math.abs(swipeState.currentY - swipeState.startY)
    const duration = Date.now() - swipeState.startTime
    const velocity = Math.abs(deltaX) / duration

    // Reset card position with animation
    cardRef.current.style.transition = 'transform 0.3s ease-out'
    cardRef.current.style.transform = 'translateX(0)'

    // Check if swipe meets threshold requirements
    const isHorizontalSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD && deltaY < MAX_VERTICAL_DEVIATION
    const isFastSwipe = velocity > SWIPE_VELOCITY_THRESHOLD && Math.abs(deltaX) > 50

    if (isHorizontalSwipe || isFastSwipe) {
      if (deltaX > 0) {
        // Swipe right - complete task
        haptic.taskCompleted() // Haptic feedback for task completion
        setTimeout(() => {
          props.onMarkCompleted?.(props.task.id)
        }, 150) // Delay to show animation
      } else {
        // Swipe left - delete task (with confirmation for non-completed tasks)
        setTimeout(() => {
          if (props.task.isCompleted) {
            haptic.taskDeleted() // Haptic feedback for task deletion
            props.onDelete?.(props.task.id)
          } else {
            // Show confirmation for non-completed tasks
            const confirmed = window.confirm(
              `Êtes-vous sûr de vouloir supprimer la tâche "${props.task.name}" ?`
            )
            if (confirmed) {
              haptic.taskDeleted() // Haptic feedback for confirmed deletion
              props.onDelete?.(props.task.id)
            }
          }
        }, 150)
      }
    }

    // Reset state
    setSwipeState(null)
    setShowSwipeIndicator(null)
  }

  // Reset transform when touch is cancelled
  useEffect(() => {
    const handleTouchCancel = () => {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s ease-out'
        cardRef.current.style.transform = 'translateX(0)'
      }
      setSwipeState(null)
      setShowSwipeIndicator(null)
    }

    const cardElement = cardRef.current
    if (cardElement) {
      cardElement.addEventListener('touchcancel', handleTouchCancel)
      return () => cardElement.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicators */}
      {showSwipeIndicator && (
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none z-10">
          {showSwipeIndicator === 'complete' && (
            <div className="flex items-center space-x-2 ml-4 bg-green-500 text-white px-3 py-2 rounded-full shadow-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Terminer</span>
            </div>
          )}
          {showSwipeIndicator === 'delete' && (
            <div className="flex items-center space-x-2 ml-auto mr-4 bg-red-500 text-white px-3 py-2 rounded-full shadow-lg">
              <span className="font-medium">Supprimer</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Task card with swipe transform */}
      <div ref={cardRef} className="will-change-transform">
        <TaskCard {...props} />
      </div>
    </div>
  )
}