export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  timestamp: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  timestamp: string
  statusCode: number
}

export class ResponseBuilder {
  static success<T>(data: T, message?: string, statusCode: number = 200): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      statusCode
    }
  }

  static created<T>(data: T, message?: string): ApiResponse<T> {
    return this.success(data, message, 201)
  }

  static noContent(message?: string): ApiResponse<null> {
    return {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 204
    }
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<T> {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      statusCode: 200
    }
  }
}