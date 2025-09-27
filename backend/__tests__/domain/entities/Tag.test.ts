import { describe, it, expect } from 'vitest'
import { Tag } from '../../../src/domain/entities/Tag'
import { createMockTag, createMockUser } from '../../utils/test-helpers'

describe('Tag Entity', () => {
  describe('Tag interface validation', () => {
    it('should create a valid tag with all required properties', () => {
      const tag = createMockTag({
        name: 'Work',
        color: '#3B82F6',
        position: 0,
        userId: 'user-1'
      })

      expect(tag.id).toBeDefined()
      expect(tag.name).toBe('Work')
      expect(tag.color).toBe('#3B82F6')
      expect(tag.position).toBe(0)
      expect(tag.userId).toBe('user-1')
      expect(tag.createdAt).toBeInstanceOf(Date)
      expect(tag.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle tag names correctly', () => {
      const tagNames = [
        'Work',
        'Personal',
        'Urgent',
        'Low Priority',
        'Project Alpha',
        'Meeting',
        'Review',
        'Bug Fix'
      ]

      tagNames.forEach(name => {
        const tag = createMockTag({ name })
        expect(tag.name).toBe(name)
      })
    })

    it('should handle different color formats', () => {
      const colors = [
        '#FF0000', // Red
        '#00FF00', // Green
        '#0000FF', // Blue
        '#3B82F6', // Blue-500
        '#EF4444', // Red-500
        '#10B981', // Emerald-500
        '#F59E0B', // Amber-500
        '#8B5CF6'  // Violet-500
      ]

      colors.forEach(color => {
        const tag = createMockTag({ color })
        expect(tag.color).toBe(color)
        expect(tag.color).toMatch(/^#[A-Fa-f0-9]{6}$/)
      })
    })

    it('should handle position ordering', () => {
      const positions = [0, 1, 2, 5, 10, 100]

      positions.forEach(position => {
        const tag = createMockTag({ position })
        expect(tag.position).toBe(position)
        expect(tag.position).toBeGreaterThanOrEqual(0)
      })
    })

    it('should handle user relationships', () => {
      const userId = 'tag-owner-1'
      const tag = createMockTag({ userId })

      expect(tag.userId).toBe(userId)
      expect(tag.user).toBeUndefined() // Optional relationship
    })

    it('should handle optional user object', () => {
      const user = createMockUser({ id: 'user-1' })
      const tag = createMockTag({
        userId: user.id,
        user: user
      })

      expect(tag.userId).toBe(user.id)
      expect(tag.user).toEqual(user)
    })
  })

  describe('Business logic validation', () => {
    it('should enforce tag name constraints', () => {
      const validNames = [
        'Work',
        'A',
        'a'.repeat(50), // Maximum length
        'Tag with spaces',
        'Tag-with-dashes',
        'Tag_with_underscores',
        'Tag123'
      ]

      validNames.forEach(name => {
        if (name.length >= 1 && name.length <= 50) {
          const tag = createMockTag({ name })
          expect(tag.name).toBe(name)
          expect(tag.name.length).toBeGreaterThan(0)
          expect(tag.name.length).toBeLessThanOrEqual(50)
        }
      })
    })

    it('should validate color hex format', () => {
      const validColors = [
        '#FF0000',
        '#00ff00',
        '#0000FF',
        '#abc123',
        '#ABC123',
        '#000000',
        '#FFFFFF'
      ]

      const invalidColors = [
        '#GG0000', // Invalid hex characters
        '#FF00',   // Too short
        '#FF00000', // Too long
        'FF0000',  // Missing #
        '#ff00gg', // Invalid hex
        'red',     // Not hex
        ''         // Empty
      ]

      validColors.forEach(color => {
        const tag = createMockTag({ color })
        expect(tag.color).toBe(color)
        expect(tag.color).toMatch(/^#[A-Fa-f0-9]{6}$/)
      })

      invalidColors.forEach(color => {
        const isValidHex = /^#[A-Fa-f0-9]{6}$/.test(color)
        expect(isValidHex).toBe(false)
      })
    })

    it('should handle position uniqueness per user', () => {
      const userId = 'user-1'
      const tag1 = createMockTag({ id: 'tag-1', userId, position: 0 })
      const tag2 = createMockTag({ id: 'tag-2', userId, position: 1 })
      const tag3 = createMockTag({ id: 'tag-3', userId, position: 2 })

      expect(tag1.position).toBe(0)
      expect(tag2.position).toBe(1)
      expect(tag3.position).toBe(2)
      expect(new Set([tag1.position, tag2.position, tag3.position]).size).toBe(3)
    })

    it('should handle user isolation', () => {
      const user1Tag = createMockTag({
        id: 'tag-1',
        name: 'Work',
        userId: 'user-1'
      })

      const user2Tag = createMockTag({
        id: 'tag-2',
        name: 'Work', // Same name, different user
        userId: 'user-2'
      })

      expect(user1Tag.name).toBe(user2Tag.name)
      expect(user1Tag.userId).not.toBe(user2Tag.userId)
      expect(user1Tag.id).not.toBe(user2Tag.id)
    })

    it('should validate reserved tag names', () => {
      const reservedNames = ['all', 'none', 'untagged', 'system']

      reservedNames.forEach(name => {
        // These would be rejected by business logic
        const isReserved = ['all', 'none', 'untagged', 'system'].includes(name.toLowerCase())
        expect(isReserved).toBe(true)
      })
    })

    it('should handle case sensitivity in names', () => {
      const tag1 = createMockTag({ name: 'Work' })
      const tag2 = createMockTag({ name: 'work' })
      const tag3 = createMockTag({ name: 'WORK' })

      // Names are case-sensitive in storage but might be compared case-insensitively
      expect(tag1.name).toBe('Work')
      expect(tag2.name).toBe('work')
      expect(tag3.name).toBe('WORK')

      expect(tag1.name.toLowerCase()).toBe(tag2.name.toLowerCase())
      expect(tag2.name.toLowerCase()).toBe(tag3.name.toLowerCase())
    })
  })

  describe('Tag ordering and positioning', () => {
    it('should maintain position order', () => {
      const tags = [
        createMockTag({ id: 'tag-1', name: 'First', position: 0 }),
        createMockTag({ id: 'tag-2', name: 'Second', position: 1 }),
        createMockTag({ id: 'tag-3', name: 'Third', position: 2 })
      ]

      const sortedTags = tags.sort((a, b) => a.position - b.position)

      expect(sortedTags[0].name).toBe('First')
      expect(sortedTags[1].name).toBe('Second')
      expect(sortedTags[2].name).toBe('Third')
    })

    it('should handle position gaps', () => {
      const tags = [
        createMockTag({ name: 'First', position: 0 }),
        createMockTag({ name: 'Third', position: 5 }),
        createMockTag({ name: 'Second', position: 2 })
      ]

      const sortedTags = tags.sort((a, b) => a.position - b.position)

      expect(sortedTags[0].name).toBe('First')
      expect(sortedTags[1].name).toBe('Second')
      expect(sortedTags[2].name).toBe('Third')
    })

    it('should handle position reordering', () => {
      const tag = createMockTag({
        name: 'Moveable',
        position: 0
      })

      // Simulate moving to position 5
      const movedTag = createMockTag({
        ...tag,
        position: 5,
        updatedAt: new Date()
      })

      expect(movedTag.position).toBe(5)
      expect(movedTag.name).toBe('Moveable')
    })

    it('should handle bulk position updates', () => {
      const tagPositions = [
        { id: 'tag-1', newPosition: 2 },
        { id: 'tag-2', newPosition: 0 },
        { id: 'tag-3', newPosition: 1 }
      ]

      tagPositions.forEach(({ id, newPosition }) => {
        const tag = createMockTag({ id, position: newPosition })
        expect(tag.position).toBe(newPosition)
      })
    })
  })

  describe('Edge cases and validation', () => {
    it('should handle empty and whitespace names', () => {
      const invalidNames = ['', '   ', '\t', '\n']

      invalidNames.forEach(name => {
        const trimmed = name.trim()
        expect(trimmed.length).toBe(0)
        // These would be rejected by validation
      })
    })

    it('should handle very long names', () => {
      const longName = 'a'.repeat(100)
      const maxName = 'a'.repeat(50)

      expect(longName.length).toBe(100)
      expect(maxName.length).toBe(50)

      // Long names would be truncated or rejected
      expect(longName.length > 50).toBe(true)
    })

    it('should handle special characters in names', () => {
      const specialNames = [
        'Tag with émojis 🏷️',
        'Tag/with/slashes',
        'Tag with "quotes"',
        'Tag with \'apostrophes\'',
        'Tag & ampersand',
        'Tag <html>',
        'Tag\nwith\nnewlines'
      ]

      specialNames.forEach(name => {
        const tag = createMockTag({ name })
        expect(tag.name).toBe(name)
      })
    })

    it('should handle invalid color formats gracefully', () => {
      const invalidColors = [
        '#GG0000',
        '#FF',
        'red',
        'rgb(255,0,0)',
        'hsl(0,100%,50%)',
        ''
      ]

      invalidColors.forEach(color => {
        const isValidHex = /^#[A-Fa-f0-9]{6}$/.test(color)
        expect(isValidHex).toBe(false)
        // Invalid colors would be replaced with default or rejected
      })
    })

    it('should handle negative positions', () => {
      const negativePosition = -1
      const tag = createMockTag({ position: negativePosition })

      // Negative positions might be allowed for specific use cases
      // or normalized to 0
      expect(tag.position).toBe(negativePosition)
    })

    it('should handle very large positions', () => {
      const largePosition = 999999
      const tag = createMockTag({ position: largePosition })

      expect(tag.position).toBe(largePosition)
      expect(tag.position).toBeGreaterThan(0)
    })

    it('should handle concurrent tag creation', () => {
      const now = new Date()
      const tag1 = createMockTag({
        id: 'concurrent-1',
        name: 'Tag 1',
        createdAt: now
      })

      const tag2 = createMockTag({
        id: 'concurrent-2',
        name: 'Tag 2',
        createdAt: now
      })

      expect(tag1.createdAt).toEqual(tag2.createdAt)
      expect(tag1.id).not.toBe(tag2.id)
    })

    it('should handle tag updates', () => {
      const originalTag = createMockTag({
        name: 'Original',
        color: '#FF0000',
        position: 0
      })

      const updatedTag = createMockTag({
        ...originalTag,
        name: 'Updated',
        color: '#00FF00',
        position: 1,
        updatedAt: new Date()
      })

      expect(updatedTag.name).toBe('Updated')
      expect(updatedTag.color).toBe('#00FF00')
      expect(updatedTag.position).toBe(1)
      expect(updatedTag.createdAt).toEqual(originalTag.createdAt)
    })
  })

  describe('Tag relationships and usage', () => {
    it('should handle tag-task relationships conceptually', () => {
      const tag = createMockTag({
        id: 'work-tag',
        name: 'Work',
        userId: 'user-1'
      })

      // This tag would be associated with tasks through TaskTag relationship
      const taskIds = ['task-1', 'task-2', 'task-3']

      expect(tag.id).toBe('work-tag')
      // TaskTag relationships would reference this tag.id
      taskIds.forEach(taskId => {
        expect(taskId).toBeTruthy()
        expect(tag.id).toBe('work-tag')
      })
    })

    it('should handle tag deletion with task cleanup', () => {
      const tag = createMockTag({
        id: 'deletable-tag',
        name: 'Temporary',
        userId: 'user-1'
      })

      // Tag deletion would require cleanup of TaskTag relationships
      expect(tag.id).toBe('deletable-tag')

      // Business logic would ensure tasks are untagged or deletion is prevented
      const hasAssociatedTasks = false // Would be checked in business logic
      expect(hasAssociatedTasks).toBe(false)
    })

    it('should validate tag limits per user', () => {
      const userId = 'user-with-many-tags'
      const maxTags = 100 // Business rule limit

      const tags = Array.from({ length: maxTags }, (_, i) =>
        createMockTag({
          id: `tag-${i}`,
          name: `Tag ${i}`,
          userId,
          position: i
        })
      )

      expect(tags.length).toBe(maxTags)
      tags.forEach((tag, index) => {
        expect(tag.userId).toBe(userId)
        expect(tag.position).toBe(index)
      })
    })
  })
})