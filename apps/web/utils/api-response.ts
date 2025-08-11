import { NextResponse } from 'next/server'

export interface ApiSuccess<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  code?: string
  details?: any
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

/**
 * Create a successful API response
 */
export function createSuccessResponse<T = any>(
  data: T,
  message?: string,
  status: number = 200,
): NextResponse {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    ...(message && { message }),
  }

  return NextResponse.json(response, { status })
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: any,
): NextResponse {
  const response: ApiError = {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details }),
  }

  return NextResponse.json(response, { status })
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  errors: string[],
  status: number = 400,
): NextResponse {
  return createErrorResponse('Validation failed', status, 'VALIDATION_ERROR', { errors })
}

/**
 * Create a not found error response
 */
export function createNotFoundResponse(resource: string): NextResponse {
  return createErrorResponse(`${resource} not found`, 404, 'NOT_FOUND')
}

/**
 * Create an unauthorized error response
 */
export function createUnauthorizedResponse(message?: string): NextResponse {
  return createErrorResponse(message || 'Unauthorized', 401, 'UNAUTHORIZED')
}

/**
 * Create a server error response
 */
export function createServerErrorResponse(message?: string): NextResponse {
  return createErrorResponse(message || 'Internal server error', 500, 'INTERNAL_ERROR')
}
