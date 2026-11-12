import { describe, it, expect } from 'vitest'
import { TaskDateConsistencyService } from '../TaskDateConsistencyService'

describe('TaskDateConsistencyService', () => {
  describe('parseDate', () => {
    it('returns null for absent / empty / invalid values', () => {
      expect(TaskDateConsistencyService.parseDate(null)).toBeNull()
      expect(TaskDateConsistencyService.parseDate(undefined)).toBeNull()
      expect(TaskDateConsistencyService.parseDate('')).toBeNull()
      expect(TaskDateConsistencyService.parseDate('   ')).toBeNull()
      expect(TaskDateConsistencyService.parseDate('not-a-date')).toBeNull()
    })

    it('parses ISO strings and Date objects', () => {
      expect(TaskDateConsistencyService.parseDate('2026-11-20')?.getTime())
        .toBe(new Date('2026-11-20').getTime())
      const d = new Date('2026-11-20T00:00:00.000Z')
      expect(TaskDateConsistencyService.parseDate(d)?.getTime()).toBe(d.getTime())
    })
  })

  describe('isDueDateBeforePlannedDate', () => {
    it('is true when the deadline precedes the planned date', () => {
      expect(
        TaskDateConsistencyService.isDueDateBeforePlannedDate('2026-12-01', '2026-11-01')
      ).toBe(true)
    })

    it('is false when the deadline is the same day or later', () => {
      expect(
        TaskDateConsistencyService.isDueDateBeforePlannedDate('2026-12-01', '2026-12-01')
      ).toBe(false)
      expect(
        TaskDateConsistencyService.isDueDateBeforePlannedDate('2026-12-01', '2026-12-05')
      ).toBe(false)
    })

    it('compares at calendar-day precision (time components are ignored)', () => {
      // Même jour, heures différentes : cohérent
      expect(
        TaskDateConsistencyService.isDueDateBeforePlannedDate(
          '2026-12-01T00:00:00.000Z',
          '2026-12-01T18:30:00.000Z'
        )
      ).toBe(false)
      // Jour précédent avec une heure tardive : incohérent
      expect(
        TaskDateConsistencyService.isDueDateBeforePlannedDate(
          '2026-12-01T00:00:00.000Z',
          '2026-11-30T23:59:00.000Z'
        )
      ).toBe(true)
    })

    it('is false when either date is missing or invalid', () => {
      expect(TaskDateConsistencyService.isDueDateBeforePlannedDate('2026-12-01', null)).toBe(false)
      expect(TaskDateConsistencyService.isDueDateBeforePlannedDate(null, '2026-11-01')).toBe(false)
      expect(TaskDateConsistencyService.isDueDateBeforePlannedDate('', '2026-11-01')).toBe(false)
      expect(TaskDateConsistencyService.isDueDateBeforePlannedDate('2026-12-01', 'oops')).toBe(false)
    })
  })

  describe('alignDueDateWithPlannedDate', () => {
    it('realigns an earlier deadline on the new planned date', () => {
      expect(
        TaskDateConsistencyService.alignDueDateWithPlannedDate('2026-12-01', '2026-11-01')
      ).toBe('2026-12-01')
    })

    it('keeps a deadline that is already on or after the planned date', () => {
      expect(
        TaskDateConsistencyService.alignDueDateWithPlannedDate('2026-12-01', '2026-12-15')
      ).toBe('2026-12-15')
      expect(
        TaskDateConsistencyService.alignDueDateWithPlannedDate('2026-12-01', '2026-12-01')
      ).toBe('2026-12-01')
    })

    it('does not invent a deadline when none is set', () => {
      expect(
        TaskDateConsistencyService.alignDueDateWithPlannedDate('2026-12-01', null)
      ).toBeNull()
      expect(
        TaskDateConsistencyService.alignDueDateWithPlannedDate('2026-12-01', undefined)
      ).toBeUndefined()
      expect(TaskDateConsistencyService.alignDueDateWithPlannedDate('2026-12-01', '')).toBe('')
    })

    it('leaves the deadline untouched when the planned date is cleared', () => {
      expect(
        TaskDateConsistencyService.alignDueDateWithPlannedDate(null, '2026-11-01')
      ).toBe('2026-11-01')
      expect(
        TaskDateConsistencyService.alignDueDateWithPlannedDate('', '2026-11-01')
      ).toBe('2026-11-01')
    })

    it('works with Date objects (backend path)', () => {
      const planned = new Date('2026-12-01T00:00:00.000Z')
      const due = new Date('2026-11-01T00:00:00.000Z')

      expect(TaskDateConsistencyService.alignDueDateWithPlannedDate(planned, due)).toBe(planned)
      expect(TaskDateConsistencyService.alignDueDateWithPlannedDate(planned, null)).toBeNull()
    })

    it('keeps a date-only string when the deadline was date-only', () => {
      expect(
        TaskDateConsistencyService.alignDueDateWithPlannedDate(
          '2026-12-01T00:00:00.000Z',
          '2026-11-01'
        )
      ).toBe('2026-12-01')
    })
  })
})
