import type { TagBase } from './TaskTypes'

/**
 * Generic Tag Entity that works with both Date objects (backend) and string dates (frontend)
 */
export class TagEntity<TDate extends string | Date = string | Date> {
  private readonly tag: TagBase<TDate>

  constructor(tag: TagBase<TDate>) {
    this.tag = tag
  }

  // Getters
  get id(): string {
    return this.tag.id
  }

  get name(): string {
    return this.tag.name
  }

  get color(): string | undefined {
    return this.tag.color
  }

  get userId(): string {
    return this.tag.userId
  }

  get createdAt(): TDate {
    return this.tag.createdAt
  }

  get updatedAt(): TDate {
    return this.tag.updatedAt
  }

  get rawTag(): TagBase<TDate> {
    return this.tag
  }

  /**
   * Check if this tag has a custom color
   */
  hasCustomColor(): boolean {
    return Boolean(this.tag.color)
  }

  /**
   * Get display color (fallback to default if no custom color)
   */
  getDisplayColor(defaultColor: string = '#6B7280'): string {
    return this.tag.color || defaultColor
  }

  /**
   * Check if tag name is valid
   */
  isValidName(): boolean {
    return this.tag.name.trim().length > 0 && this.tag.name.length <= 50
  }

  /**
   * Check if color is a valid hex color
   */
  isValidColor(): boolean {
    if (!this.tag.color) return true // Color is optional

    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    return hexColorRegex.test(this.tag.color)
  }

  /**
   * Get contrast color (white or black) for the tag background
   */
  getContrastColor(): string {
    const color = this.getDisplayColor()

    // Remove # if present
    const hex = color.replace('#', '')

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }

  /**
   * Get formatted display name
   */
  getDisplayName(): string {
    return this.tag.name.trim()
  }

  /**
   * Check if tag was created recently (within last 24 hours)
   */
  isRecentlyCreated(): boolean {
    try {
      const createdDate = new Date(this.tag.createdAt as string | number | Date)
      const now = new Date()
      const dayInMs = 24 * 60 * 60 * 1000

      return (now.getTime() - createdDate.getTime()) < dayInMs
    } catch {
      return false
    }
  }

  /**
   * Check if tag was recently updated (within last hour)
   */
  isRecentlyUpdated(): boolean {
    try {
      const updatedDate = new Date(this.tag.updatedAt as string | number | Date)
      const now = new Date()
      const hourInMs = 60 * 60 * 1000

      return (now.getTime() - updatedDate.getTime()) < hourInMs
    } catch {
      return false
    }
  }

  /**
   * Get tag initials for compact display (first 2 characters)
   */
  getInitials(): string {
    return this.tag.name.trim().substring(0, 2).toUpperCase()
  }

  /**
   * Validate the entire tag
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.isValidName()) {
      errors.push('Tag name must be between 1 and 50 characters')
    }

    if (!this.isValidColor()) {
      errors.push('Color must be a valid hex color (e.g., #FF0000)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}