/**
 * Central Configuration — Centralized application constants
 */

// API base URL — configurable for different environments (uses Vite's import.meta.env)
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

// Other constants can be added here as needed
export const CONFIG = {
  API_BASE,
  TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3
}
