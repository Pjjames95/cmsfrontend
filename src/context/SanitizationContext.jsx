// src/context/SanitizationContext.jsx
import React, { createContext, useContext, useCallback } from 'react'
import { sanitizeHtml, sanitizeText, sanitizeObject } from '../utils/sanitize'

const SanitizationContext = createContext()

export const useSanitization = () => {
  const context = useContext(SanitizationContext)
  if (!context) {
    throw new Error('useSanitization must be used within SanitizationProvider')
  }
  return context
}

export const SanitizationProvider = ({ children }) => {
  const sanitize = useCallback((data, options = {}) => {
    if (typeof data === 'string') {
      return options.asHtml !== false ? sanitizeHtml(data) : sanitizeText(data)
    }
    if (Array.isArray(data)) {
      return data.map(item => sanitize(item, options))
    }
    if (data && typeof data === 'object') {
      return sanitizeObject(data)
    }
    return data
  }, [])

  const value = {
    sanitize,
    sanitizeHtml,
    sanitizeText,
    sanitizeObject
  }

  return (
    <SanitizationContext.Provider value={value}>
      {children}
    </SanitizationContext.Provider>
  )
}