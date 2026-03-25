// Import from the base supabase file
import { supabase, testConnection } from './supabase'
// Import sanitized wrapper
import { sanitizedDb } from './supabaseSanitized'

// Re-export everything
export { supabase, testConnection, sanitizedDb }

// Helper to get sanitized data from any query
export const getSanitizedData = async (queryFn) => {
  const result = await queryFn()
  if (result.data) {
    if (Array.isArray(result.data)) {
      result.data = result.data.map(item => sanitizedDb.sanitize(item))
    } else {
      result.data = sanitizedDb.sanitize(result.data)
    }
  }
  return result
}