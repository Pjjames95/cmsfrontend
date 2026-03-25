// src/components/hoc/WithSanitization.jsx
import React, { useEffect } from 'react'
import { useSanitizedData } from '../../hooks/useSanitizedData'

// HOC that automatically sanitizes props before passing to wrapped component
export const withSanitization = (WrappedComponent, options = {}) => {
  return (props) => {
    const sanitizedProps = {}
    
    // Sanitize each prop that is a string or object
    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === 'string') {
        if (options.htmlFields?.includes(key)) {
          sanitizedProps[key] = useSanitizedData(value, { sanitizeAsHtml: true }).data
        } else {
          sanitizedProps[key] = useSanitizedData(value, { sanitizeAsHtml: false }).data
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitizedProps[key] = useSanitizedData(value).data
      } else {
        sanitizedProps[key] = value
      }
    })
    
    return <WrappedComponent {...props} {...sanitizedProps} />
  }
}

// Component that sanitizes its children
export const SanitizedContent = ({ children, asHtml = true, className = '' }) => {
  const { data: sanitized } = useSanitizedData(children, { sanitizeAsHtml: asHtml })
  
  if (asHtml) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    )
  }
  
  return <span className={className}>{sanitized}</span>
}