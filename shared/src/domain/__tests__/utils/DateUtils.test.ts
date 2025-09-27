import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  normalizeDate,
  dateToString,
  stringToDate,
  isDateUrgent,
  createDateContext,
  compareDates
} from '../../utils/DateUtils'

describe('DateUtils', () => {
  beforeEach(() => {
    // Set a fixed date for consistent testing
    const fixedDate = new Date('2023-06-15T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(fixedDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('normalizeDate', () => {
    it('should normalize string date to UTC midnight', () => {
      const result = normalizeDate('2023-06-15T15:30:00Z')
      expect(result).toEqual(new Date(Date.UTC(2023, 5, 15)))
    })

    it('should normalize Date object to UTC midnight', () => {
      const input = new Date('2023-06-15T15:30:00Z')
      const result = normalizeDate(input)
      expect(result).toEqual(new Date(Date.UTC(2023, 5, 15)))
    })

    it('should handle different timezones consistently', () => {
      const times = [
        '2023-06-15T00:00:00Z',
        '2023-06-15T12:00:00Z',
        '2023-06-15T23:59:59Z'
      ]

      times.forEach(time => {
        const result = normalizeDate(time)
        expect(result).toEqual(new Date(Date.UTC(2023, 5, 15)))
      })
    })

    it('should preserve the date part only', () => {
      const input = new Date('2023-06-15T23:59:59.999Z')
      const result = normalizeDate(input)

      expect(result.getUTCFullYear()).toBe(2023)
      expect(result.getUTCMonth()).toBe(5) // June = 5 (0-indexed)
      expect(result.getUTCDate()).toBe(15)
      expect(result.getUTCHours()).toBe(0)
      expect(result.getUTCMinutes()).toBe(0)
      expect(result.getUTCSeconds()).toBe(0)
      expect(result.getUTCMilliseconds()).toBe(0)
    })

    it('should handle edge cases', () => {
      // Leap year
      const leapYear = normalizeDate('2024-02-29T15:30:00Z')
      expect(leapYear).toEqual(new Date(Date.UTC(2024, 1, 29)))

      // End of year
      const endOfYear = normalizeDate('2023-12-31T23:59:59Z')
      expect(endOfYear).toEqual(new Date(Date.UTC(2023, 11, 31)))

      // Beginning of year
      const beginningOfYear = normalizeDate('2023-01-01T00:00:01Z')
      expect(beginningOfYear).toEqual(new Date(Date.UTC(2023, 0, 1)))
    })

    it('should handle DST transitions', () => {
      // These dates should be normalized to midnight UTC regardless of local DST
      const springForward = normalizeDate('2023-03-12T15:30:00Z') // DST begins in US
      const fallBack = normalizeDate('2023-11-05T15:30:00Z') // DST ends in US

      expect(springForward).toEqual(new Date(Date.UTC(2023, 2, 12)))
      expect(fallBack).toEqual(new Date(Date.UTC(2023, 10, 5)))
    })
  })

  describe('dateToString', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date('2023-06-15T12:00:00Z')
      const result = dateToString(date)

      expect(result).toBe('2023-06-15T12:00:00.000Z')
      expect(typeof result).toBe('string')
    })

    it('should handle different Date objects', () => {
      const dates = [
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-06-15T12:30:45Z'),
        new Date('2023-12-31T23:59:59Z')
      ]

      dates.forEach(date => {
        const result = dateToString(date)
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(new Date(result)).toEqual(date)
      })
    })

    it('should preserve milliseconds', () => {
      const dateWithMs = new Date('2023-06-15T12:30:45.123Z')
      const result = dateToString(dateWithMs)

      expect(result).toBe('2023-06-15T12:30:45.123Z')
    })

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid')
      const result = dateToString(invalidDate)

      expect(result).toBe('Invalid Date')
    })
  })

  describe('stringToDate', () => {
    it('should convert string to Date object', () => {
      const dateStr = '2023-06-15T12:00:00Z'
      const result = stringToDate(dateStr)

      expect(result).toBeInstanceOf(Date)
      expect(result).toEqual(new Date('2023-06-15T12:00:00Z'))
    })

    it('should handle different string formats', () => {
      const formats = [
        '2023-06-15T12:00:00Z',
        '2023-06-15T12:00:00.000Z',
        '2023-06-15T12:00:00+00:00',
        '2023-06-15'
      ]

      formats.forEach(format => {
        const result = stringToDate(format)
        expect(result).toBeInstanceOf(Date)
        expect(isNaN(result.getTime())).toBe(false)
      })
    })

    it('should handle invalid date strings', () => {
      const invalidStrings = [
        'invalid-date',
        'not-a-date',
        '2023-13-45', // Invalid month/day
        ''
      ]

      invalidStrings.forEach(invalid => {
        const result = stringToDate(invalid)
        expect(isNaN(result.getTime())).toBe(true)
      })
    })

    it('should be inverse of dateToString for valid dates', () => {
      const originalDate = new Date('2023-06-15T12:30:45.123Z')
      const stringified = dateToString(originalDate)
      const parsed = stringToDate(stringified)

      expect(parsed).toEqual(originalDate)
    })
  })

  describe('isDateUrgent', () => {
    it('should return true for dates within threshold (default 2 days)', () => {
      const currentDate = new Date('2023-06-15T12:00:00Z')

      const urgentDates = [
        '2023-06-15T12:00:00Z', // today
        '2023-06-16T12:00:00Z', // tomorrow
        new Date('2023-06-15T06:00:00Z'), // earlier today
        new Date('2023-06-16T18:00:00Z')  // tomorrow evening
      ]

      urgentDates.forEach(date => {
        expect(isDateUrgent(date, 2, currentDate)).toBe(true)
      })
    })

    it('should return false for dates outside threshold', () => {
      const currentDate = new Date('2023-06-15T12:00:00Z')
      const nonUrgentDates = [
        '2023-06-12T12:00:00Z', // 3 days ago
        '2023-06-18T12:00:00Z', // 3 days from now
        '2023-06-17T12:00:00Z', // day after tomorrow (past threshold)
        new Date('2023-06-10T12:00:00Z'), // 5 days ago
        new Date('2023-06-20T12:00:00Z')  // 5 days from now
      ]

      nonUrgentDates.forEach(date => {
        const result = isDateUrgent(date, 2, currentDate)
        if (result !== false) {
          console.log(`Date ${date} should be non-urgent but returned ${result}`)
        }
        expect(result).toBe(false)
      })
    })

    it('should handle custom threshold', () => {
      const currentDate = new Date('2023-06-15T12:00:00Z')
      const date = '2023-06-18T12:00:00Z' // 3 days from now

      expect(isDateUrgent(date, 2, currentDate)).toBe(false) // 2-day threshold
      expect(isDateUrgent(date, 4, currentDate)).toBe(true)  // 4-day threshold
    })

    it('should handle both string and Date inputs', () => {
      const currentDate = new Date('2023-06-15T12:00:00Z')
      const dateStr = '2023-06-16T12:00:00Z'
      const dateObj = new Date('2023-06-16T12:00:00Z')

      expect(isDateUrgent(dateStr, 2, currentDate)).toBe(isDateUrgent(dateObj, 2, currentDate))
    })

    it('should handle invalid dates gracefully', () => {
      const currentDate = new Date('2023-06-15T12:00:00Z')
      const invalidDates = [
        'invalid-date',
        new Date('invalid'),
        'not-a-date-at-all'
      ]

      invalidDates.forEach(invalid => {
        expect(isDateUrgent(invalid, 2, currentDate)).toBe(false)
      })
    })

    it('should handle edge cases around midnight', () => {
      const currentDate = new Date('2023-06-15T12:00:00Z')
      // Test with times right around the threshold boundary
      // With 2-day threshold from 2023-06-15, threshold is 2023-06-17
      const justBeforeThreshold = '2023-06-16T23:59:59Z' // Should be urgent
      const exactlyAtThreshold = '2023-06-17T00:00:00Z' // Should not be urgent
      const justAfterThreshold = '2023-06-17T00:00:01Z' // Should not be urgent

      expect(isDateUrgent(justBeforeThreshold, 2, currentDate)).toBe(true)
      expect(isDateUrgent(exactlyAtThreshold, 2, currentDate)).toBe(false)
      expect(isDateUrgent(justAfterThreshold, 2, currentDate)).toBe(false)
    })
  })

  describe('createDateContext', () => {
    it('should create normalized date context', () => {
      const context = createDateContext()

      expect(context).toHaveProperty('today')
      expect(context).toHaveProperty('tomorrow')
      expect(context).toHaveProperty('dayAfterTomorrow')

      expect(context.today).toBeInstanceOf(Date)
      expect(context.tomorrow).toBeInstanceOf(Date)
      expect(context.dayAfterTomorrow).toBeInstanceOf(Date)
    })

    it('should create dates at UTC midnight', () => {
      const context = createDateContext()

      expect(context.today.getUTCHours()).toBe(0)
      expect(context.today.getUTCMinutes()).toBe(0)
      expect(context.today.getUTCSeconds()).toBe(0)

      expect(context.tomorrow.getUTCHours()).toBe(0)
      expect(context.tomorrow.getUTCMinutes()).toBe(0)
      expect(context.tomorrow.getUTCSeconds()).toBe(0)

      expect(context.dayAfterTomorrow.getUTCHours()).toBe(0)
      expect(context.dayAfterTomorrow.getUTCMinutes()).toBe(0)
      expect(context.dayAfterTomorrow.getUTCSeconds()).toBe(0)
    })

    it('should create consecutive dates', () => {
      const context = createDateContext()

      expect(context.tomorrow.getTime() - context.today.getTime()).toBe(24 * 60 * 60 * 1000)
      expect(context.dayAfterTomorrow.getTime() - context.tomorrow.getTime()).toBe(24 * 60 * 60 * 1000)
    })

    it('should be consistent across calls', () => {
      const context1 = createDateContext()
      const context2 = createDateContext()

      expect(context1.today).toEqual(context2.today)
      expect(context1.tomorrow).toEqual(context2.tomorrow)
      expect(context1.dayAfterTomorrow).toEqual(context2.dayAfterTomorrow)
    })

    it('should handle month/year boundaries', () => {
      // Test end of month
      vi.setSystemTime(new Date('2023-06-30T23:59:59Z'))
      const endOfMonth = createDateContext()

      expect(endOfMonth.today.getUTCDate()).toBe(30)
      expect(endOfMonth.tomorrow.getUTCDate()).toBe(1) // July 1st
      expect(endOfMonth.tomorrow.getUTCMonth()).toBe(6) // July = 6

      // Test end of year
      vi.setSystemTime(new Date('2023-12-31T23:59:59Z'))
      const endOfYear = createDateContext()

      expect(endOfYear.today.getUTCFullYear()).toBe(2023)
      expect(endOfYear.tomorrow.getUTCFullYear()).toBe(2024)
      expect(endOfYear.tomorrow.getUTCMonth()).toBe(0) // January = 0
      expect(endOfYear.tomorrow.getUTCDate()).toBe(1)
    })
  })

  describe('compareDates', () => {
    it('should compare dates correctly (ascending)', () => {
      const earlier = '2023-06-14T12:00:00Z'
      const later = '2023-06-16T12:00:00Z'

      expect(compareDates(earlier, later)).toBeLessThan(0)
      expect(compareDates(later, earlier)).toBeGreaterThan(0)
      expect(compareDates(earlier, earlier)).toBe(0)
    })

    it('should work with mixed input types', () => {
      const stringDate = '2023-06-15T12:00:00Z'
      const dateObject = new Date('2023-06-15T12:00:00Z')

      expect(compareDates(stringDate, dateObject)).toBe(0)
      expect(compareDates(dateObject, stringDate)).toBe(0)
    })

    it('should normalize dates before comparison', () => {
      const date1 = '2023-06-15T08:30:00Z'
      const date2 = '2023-06-15T20:45:00Z'

      // Both should normalize to the same date (2023-06-15 at midnight)
      expect(compareDates(date1, date2)).toBe(0)
    })

    it('should handle different date formats', () => {
      const iso = '2023-06-15T12:00:00Z'
      const dateObj = new Date(2023, 5, 15, 15, 30) // June 15, 2023, 3:30 PM local
      const normalized = new Date(Date.UTC(2023, 5, 15))

      // All should represent the same day when normalized
      expect(compareDates(iso, normalized)).toBe(0)
    })

    it('should be transitive', () => {
      const dates = [
        '2023-06-13T12:00:00Z',
        '2023-06-14T18:30:00Z',
        '2023-06-15T06:15:00Z'
      ]

      // If a < b and b < c, then a < c
      expect(compareDates(dates[0], dates[1])).toBeLessThan(0)
      expect(compareDates(dates[1], dates[2])).toBeLessThan(0)
      expect(compareDates(dates[0], dates[2])).toBeLessThan(0)
    })

    it('should handle edge cases', () => {
      const leapDay = '2024-02-29T12:00:00Z'
      const dayBefore = '2024-02-28T12:00:00Z'
      const dayAfter = '2024-03-01T12:00:00Z'

      expect(compareDates(dayBefore, leapDay)).toBeLessThan(0)
      expect(compareDates(leapDay, dayAfter)).toBeLessThan(0)
    })
  })

  describe('integration tests', () => {
    it('should work together for typical use cases', () => {
      const now = new Date()
      const context = createDateContext()

      // Test that today's context date is actually today
      expect(normalizeDate(now)).toEqual(context.today)

      // Test urgency detection with context
      expect(isDateUrgent(context.today)).toBe(true)
      expect(isDateUrgent(context.tomorrow)).toBe(true)
      expect(isDateUrgent(context.dayAfterTomorrow)).toBe(false)
    })

    it('should maintain consistency across transformations', () => {
      const originalDate = new Date('2023-06-15T15:30:45.123Z')

      // String -> Date -> String should be consistent
      const stringified = dateToString(originalDate)
      const parsed = stringToDate(stringified)
      const restringified = dateToString(parsed)

      expect(restringified).toBe(stringified)

      // Normalization should be idempotent
      const normalized = normalizeDate(originalDate)
      const renormalized = normalizeDate(normalized)

      expect(renormalized).toEqual(normalized)
    })

    it('should handle timezone-independent operations', () => {
      // These should behave the same regardless of local timezone
      const utcDate = '2023-06-15T12:00:00Z'
      const localDate = new Date(2023, 5, 15, 14, 30) // June 15, 2:30 PM local

      const utcNormalized = normalizeDate(utcDate)
      const localNormalized = normalizeDate(localDate)

      // Both should normalize to the same UTC midnight
      expect(utcNormalized.getUTCDate()).toBe(localNormalized.getUTCDate())
      expect(utcNormalized.getUTCMonth()).toBe(localNormalized.getUTCMonth())
      expect(utcNormalized.getUTCFullYear()).toBe(localNormalized.getUTCFullYear())
    })

    it('should support task scheduling workflows', () => {
      const context = createDateContext()

      // Simulate scheduling a task for tomorrow
      const taskDate = context.tomorrow
      const taskDateString = dateToString(taskDate)

      // Check if it's urgent (should be true)
      expect(isDateUrgent(taskDateString)).toBe(true)

      // Compare with today (should be 1 day later)
      expect(compareDates(context.today, taskDate)).toBeLessThan(0)

      // Reschedule to day after tomorrow
      const rescheduled = context.dayAfterTomorrow
      expect(isDateUrgent(rescheduled)).toBe(false)
      expect(compareDates(taskDate, rescheduled)).toBeLessThan(0)
    })
  })
})