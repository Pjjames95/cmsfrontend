// src/lib/supabaseSanitized.js
import { supabase } from './supabase'
import { sanitizeHtml, sanitizeText } from '../utils/sanitize'

// Fields that should be sanitized as HTML (preserve formatting)
const HTML_FIELDS = [
  'content', 'description', 'notes', 'motivation', 'goal', 'announcements'
]

// Fields that should be sanitized as plain text (remove HTML)
const TEXT_FIELDS = [
  'title', 'name', 'author', 'speaker', 'location', 'address',
  'contact_name', 'emergency_contact_name', 'summary'
]

// Fields that should be sanitized but are arrays
const ARRAY_FIELDS = [
  'skills', 'availability', 'tags', 'musicians', 'songs', 'gallery_images'
]

// Sanitize a single record
const sanitizeRecord = (record) => {
  if (!record || typeof record !== 'object') return record
  
  const sanitized = { ...record }
  
  // Sanitize HTML fields
  HTML_FIELDS.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeHtml(sanitized[field])
    }
  })
  
  // Sanitize text fields
  TEXT_FIELDS.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field])
    }
  })
  
  // Sanitize array fields
  ARRAY_FIELDS.forEach(field => {
    if (Array.isArray(sanitized[field])) {
      sanitized[field] = sanitized[field].map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      )
    }
  })
  
  return sanitized
}

// Create a sanitized query wrapper
export const sanitizedDb = {
  from: (table) => {
    const query = supabase.from(table)
    
    // Store the original methods
    const originalSelect = query.select
    const originalSingle = query.single
    const originalMaybeSingle = query.maybeSingle
    
    // Override select method
    query.select = function(...args) {
      const result = originalSelect.apply(this, args)
      
      // Wrap the then method to sanitize data
      const originalThen = result.then
      result.then = function(callback) {
        return originalThen.call(this, (response) => {
          if (response.data) {
            if (Array.isArray(response.data)) {
              response.data = response.data.map(record => sanitizeRecord(record))
            } else {
              response.data = sanitizeRecord(response.data)
            }
          }
          return callback(response)
        })
      }
      
      return result
    }
    
    // Override single method
    query.single = function() {
      const result = originalSingle.apply(this)
      const originalThen = result.then
      result.then = function(callback) {
        return originalThen.call(this, (response) => {
          if (response.data) {
            response.data = sanitizeRecord(response.data)
          }
          return callback(response)
        })
      }
      return result
    }
    
    // Override maybeSingle method
    query.maybeSingle = function() {
      const result = originalMaybeSingle.apply(this)
      const originalThen = result.then
      result.then = function(callback) {
        return originalThen.call(this, (response) => {
          if (response.data) {
            response.data = sanitizeRecord(response.data)
          }
          return callback(response)
        })
      }
      return result
    }
    
    return query
  },
  
  // Direct sanitization function for manual use
  sanitize: sanitizeRecord,
  sanitizeArray: (data) => {
    if (!data) return data
    if (Array.isArray(data)) return data.map(item => sanitizeRecord(item))
    return sanitizeRecord(data)
  }
}