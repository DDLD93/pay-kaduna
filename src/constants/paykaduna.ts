/**
 * PayKaduna Data Dictionaries
 * These constants map to values used in the PayKaduna API
 */

export const GENDERS = {
  Female: 1,
  Male: 2,
  NotSpecified: 3,
} as const;

export type Gender = typeof GENDERS[keyof typeof GENDERS];

export const STATES = {
  Kaduna: 19,
} as const;

export type State = typeof STATES[keyof typeof STATES];

/**
 * Industries mapping
 * TODO: Extract complete list from PayKaduna API Documentation Section 3.5
 * Placeholder structure - update with actual values from PDF
 */
export const INDUSTRIES: Record<string, number> = {
  Agriculture: 1,
  OilAndGas: 2,
  // Add more industries as needed from PDF Section 3.5
} as const;

/**
 * Local Government Areas (LGAs) mapping
 * TODO: Extract complete list from PayKaduna API Documentation Section 3.2
 * Placeholder structure - update with actual values from PDF
 */
export const LGAS: Record<string, number> = {
  // Add LGAs from PDF Section 3.2
} as const;

/**
 * Tax Stations mapping
 * TODO: Extract complete list from PayKaduna API Documentation Section 3.4
 * Placeholder structure - update with actual values from PDF
 */
export const TAX_STATIONS: Record<string, number> = {
  // Add Tax Stations from PDF Section 3.4
} as const;
