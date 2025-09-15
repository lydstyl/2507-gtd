import { Request } from 'express'

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string
    email: string
  }
}

export interface RequestWithPagination extends Request {
  pagination?: {
    page: number
    limit: number
    offset: number
  }
}

export interface AuthenticatedRequestWithPagination extends AuthenticatedRequest, RequestWithPagination {}