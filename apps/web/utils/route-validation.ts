import { SportSchema, type SportParam } from './espn'
import { z } from 'zod'

/**
 * Schema for division validation
 * Add more divisions as needed
 */
export const DivisionSchema = z.enum(['FBS', 'FCS', 'D2', 'D3'])
export type DivisionParam = z.infer<typeof DivisionSchema>

/**
 * Validate sport parameter
 */
export function validateSport(sport: string): {
  isValid: boolean
  sport?: SportParam
  error?: string
} {
  try {
    const validSport = SportSchema.parse(sport)
    return { isValid: true, sport: validSport }
  } catch {
    return {
      isValid: false,
      error: `Invalid sport: ${sport}. Must be one of: ${SportSchema.options.join(', ')}`,
    }
  }
}

/**
 * Validate division parameter
 */
export function validateDivision(division: string): {
  isValid: boolean
  division?: DivisionParam
  error?: string
} {
  try {
    const validDivision = DivisionSchema.parse(division)
    return { isValid: true, division: validDivision }
  } catch {
    return {
      isValid: false,
      error: `Invalid division: ${division}. Must be one of: ${DivisionSchema.options.join(', ')}`,
    }
  }
}

/**
 * Validate route parameters for ranking endpoints
 */
export function validateRankingParams(
  sport: string,
  division: string,
): {
  isValid: boolean
  sport?: SportParam
  division?: DivisionParam
  errors?: string[]
} {
  const sportValidation = validateSport(sport)
  const divisionValidation = validateDivision(division)

  const errors: string[] = []

  if (!sportValidation.isValid) {
    errors.push(sportValidation.error!)
  }

  if (!divisionValidation.isValid) {
    errors.push(divisionValidation.error!)
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    sport: sportValidation.sport,
    division: divisionValidation.division,
  }
}
