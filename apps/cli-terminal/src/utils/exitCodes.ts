/**
 * Standardized exit codes for CI/CD integration
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  CONFIG_ERROR: 2,
  AUTH_ERROR: 3,
  RATE_LIMIT: 4,
  SEARCH_ERROR: 5,
  USER_INTERRUPT: 130,
  UNHANDLED_ERROR: 255,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];