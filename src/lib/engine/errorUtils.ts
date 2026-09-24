import { MarketActionResult } from "../types";

/**
 * Error Utilities for Market Engine
 *
 * Provides standardized error result creation for consistent error handling
 * across all market actions.
 */

/**
 * Creates a standardized failure MarketActionResult.
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 * @returns MarketActionResult with success: false
 */
export function makeFailure<T>(
  message: string,
  code: string,
): MarketActionResult<T> {
  return {
    success: false,
    message,
    error: code,
  };
}