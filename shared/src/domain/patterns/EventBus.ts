/**
 * Shared event bus pattern for domain events
 */

export interface DomainEvent<T = any> {
  /**
   * Event type/name
   */
  type: string
  /**
   * Event payload
   */
  payload: T
  /**
   * Timestamp when event was created
   */
  timestamp: Date
  /**
   * Optional metadata
   */
  metadata?: Record<string, any>
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>

export interface EventSubscription {
  /**
   * Unsubscribe from the event
   */
  unsubscribe(): void
}

/**
 * Simple in-memory event bus for domain events
 */
export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()
  private wildcardHandlers: Set<EventHandler> = new Set()

  /**
   * Subscribe to a specific event type
   */
  subscribe<T = any>(eventType: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }

    this.handlers.get(eventType)!.add(handler)

    return {
      unsubscribe: () => {
        const handlers = this.handlers.get(eventType)
        if (handlers) {
          handlers.delete(handler)
          if (handlers.size === 0) {
            this.handlers.delete(eventType)
          }
        }
      }
    }
  }

  /**
   * Subscribe to all events (wildcard)
   */
  subscribeAll(handler: EventHandler): EventSubscription {
    this.wildcardHandlers.add(handler)

    return {
      unsubscribe: () => {
        this.wildcardHandlers.delete(handler)
      }
    }
  }

  /**
   * Publish an event
   */
  async publish<T = any>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) || new Set()
    const allHandlers = [...handlers, ...this.wildcardHandlers]

    // Execute handlers in parallel
    await Promise.all(
      allHandlers.map(handler => {
        try {
          return Promise.resolve(handler(event))
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error)
          return Promise.resolve()
        }
      })
    )
  }

  /**
   * Publish an event synchronously (fire and forget)
   */
  publishSync<T = any>(event: DomainEvent<T>): void {
    const handlers = this.handlers.get(event.type) || new Set()
    const allHandlers = [...handlers, ...this.wildcardHandlers]

    allHandlers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error)
      }
    })
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.handlers.clear()
    this.wildcardHandlers.clear()
  }

  /**
   * Get number of handlers for an event type
   */
  getHandlerCount(eventType: string): number {
    return (this.handlers.get(eventType)?.size || 0) + this.wildcardHandlers.size
  }
}

/**
 * Event builder for creating domain events
 */
export class DomainEventBuilder {
  /**
   * Create a domain event
   */
  static create<T>(type: string, payload: T, metadata?: Record<string, any>): DomainEvent<T> {
    return {
      type,
      payload,
      timestamp: new Date(),
      metadata
    }
  }

  /**
   * Create a task-related event
   */
  static createTaskEvent<T>(eventName: string, payload: T): DomainEvent<T> {
    return this.create(`task.${eventName}`, payload)
  }

  /**
   * Create a tag-related event
   */
  static createTagEvent<T>(eventName: string, payload: T): DomainEvent<T> {
    return this.create(`tag.${eventName}`, payload)
  }
}

/**
 * Common task domain events
 */
export class TaskEvents {
  static readonly CREATED = 'task.created'
  static readonly UPDATED = 'task.updated'
  static readonly DELETED = 'task.deleted'
  static readonly COMPLETED = 'task.completed'
  static readonly REOPENED = 'task.reopened'
  static readonly MOVED = 'task.moved'
}

/**
 * Common tag domain events
 */
export class TagEvents {
  static readonly CREATED = 'tag.created'
  static readonly UPDATED = 'tag.updated'
  static readonly DELETED = 'tag.deleted'
  static readonly ASSIGNED = 'tag.assigned'
  static readonly UNASSIGNED = 'tag.unassigned'
}

/**
 * Global event bus instance
 */
export const globalEventBus = new EventBus()