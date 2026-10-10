import { EngineResult } from "../types";

/**
 * Error Utilities for Game Engine
 *
 * Provides standardized error result creation for consistent error handling
 * across all engine operations (market, events, rounds, etc.).
 */

/**
 * Creates a standardized failure EngineResult.
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 * @returns EngineResult with success: false
 */
export function makeFailure<T>(message: string, code: string): EngineResult<T> {
  return {
    success: false,
    message,
    error: code,
  };
}
