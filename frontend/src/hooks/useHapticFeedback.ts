import { useCallback } from 'react'

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

interface HapticPatterns {
  light: number | number[]
  medium: number | number[]
  heavy: number | number[]
  success: number | number[]
  warning: number | number[]
  error: number | number[]
}

// Haptic feedback patterns (in milliseconds)
const HAPTIC_PATTERNS: HapticPatterns = {
  light: 10,          // Quick light tap
  medium: 20,         // Medium tap
  heavy: 40,          // Strong tap
  success: [10, 50, 10], // Double tap for success
  warning: [20, 100, 20], // Longer pattern for warning
  error: [50, 100, 50, 100, 50] // Strong pattern for errors
}

export function useHapticFeedback() {
  const isHapticSupported = useCallback((): boolean => {
    return 'vibrate' in navigator && typeof navigator.vibrate === 'function'
  }, [])

  const triggerHaptic = useCallback((type: HapticType = 'light'): void => {
    if (!isHapticSupported()) {
      return
    }

    try {
      const pattern = HAPTIC_PATTERNS[type]
      navigator.vibrate(pattern)
    } catch (error) {
      // Silently fail if vibration is not available or fails
      console.debug('Haptic feedback failed:', error)
    }
  }, [isHapticSupported])

  // Specific haptic feedback functions for common actions
  const hapticFeedback = {
    // Task actions
    taskCompleted: () => triggerHaptic('success'),
    taskDeleted: () => triggerHaptic('warning'),
    taskCreated: () => triggerHaptic('medium'),
    taskUpdated: () => triggerHaptic('light'),

    // UI interactions
    buttonPress: () => triggerHaptic('light'),
    swipeAction: () => triggerHaptic('medium'),
    modalOpen: () => triggerHaptic('light'),
    modalClose: () => triggerHaptic('light'),

    // Error states
    error: () => triggerHaptic('error'),
    warning: () => triggerHaptic('warning'),

    // Navigation
    navigationChange: () => triggerHaptic('light'),

    // Custom pattern
    custom: (pattern: number | number[]) => {
      if (isHapticSupported()) {
        try {
          navigator.vibrate(pattern)
        } catch (error) {
          console.debug('Custom haptic feedback failed:', error)
        }
      }
    }
  }

  return {
    isSupported: isHapticSupported(),
    trigger: triggerHaptic,
    ...hapticFeedback
  }
}