// src/hooks/useSanitizedData.js
import { useState, useEffect, useCallback } from 'react'
import { sanitizeHtml, sanitizeText, sanitizeObject } from '../utils/sanitize'

export const useSanitizedData = (data, options = {}) => {
  const [sanitizedData, setSanitizedData] = useState(data)
  const [isSanitizing, setIsSanitizing] = useState(false)

  const sanitize = useCallback((input) => {
    setIsSanitizing(true)
    
    let result
    if (typeof input === 'string') {
      result = options.sanitizeAsHtml !== false ? sanitizeHtml(input) : sanitizeText(input)
    } else if (Array.isArray(input)) {
      result = input.map(item => sanitize(item))
    } else if (input && typeof input === 'object') {
      result = {}
      for (const [key, value] of Object.entries(input)) {
        // Skip sanitizing certain fields if specified
        if (options.skipFields?.includes(key)) {
          result[key] = value
        } else {
          result[key] = sanitize(value)
        }
      }
    } else {
      result = input
    }
    
    setIsSanitizing(false)
    return result
  }, [options])

  useEffect(() => {
    if (data !== undefined) {
      setSanitizedData(sanitize(data))
    }
  }, [data, sanitize])

  return { data: sanitizedData, isSanitizing, sanitize }
}