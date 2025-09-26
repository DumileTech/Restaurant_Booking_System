// Error handling utilities
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409)
  }
}

export function handleApiError(error: unknown): { message: string; statusCode: number } {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode
    }
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('duplicate key')) {
      return {
        message: 'Resource already exists',
        statusCode: 409
      }
    }

    if (error.message.includes('foreign key')) {
      return {
        message: 'Invalid reference to related resource',
        statusCode: 400
      }
    }

    if (error.message.includes('not found')) {
      return {
        message: 'Resource not found',
        statusCode: 404
      }
    }

    return {
      message: error.message,
      statusCode: 500
    }
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500
  }
}

export function logError(error: unknown, context?: string) {
  // Skip logging expected authentication errors to reduce console noise
  if (error instanceof AuthenticationError) {
    return
  }

  const timestamp = new Date().toISOString()
  const contextStr = context ? `[${context}] ` : ''
  
  if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr}Error: ${error.message}`)
    console.error(`Stack: ${error.stack}`)
  } else {
    console.error(`${timestamp} ${contextStr}Unknown error:`, error)
  }
}