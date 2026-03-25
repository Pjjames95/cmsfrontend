// src/utils/sanitize.js
import DOMPurify from 'dompurify'

// Configure DOMPurify
const config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'blockquote',
    'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'section', 'article'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'src', 'alt', 'title',
    'class', 'id', 'style', 'align',
    'width', 'height'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
}

// Sanitize HTML content
export const sanitizeHtml = (html) => {
  if (!html) return ''
  return DOMPurify.sanitize(html, config)
}

// Sanitize text (remove HTML)
export const sanitizeText = (text) => {
  if (!text) return ''
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}

// Sanitize URL
export const sanitizeUrl = (url) => {
  if (!url) return ''
  return DOMPurify.sanitize(url, { ALLOWED_TAGS: [], ALLOWED_ATTR: ['href'] })
}

// Sanitize object (recursively)
export const sanitizeObject = (obj) => {
  if (!obj) return obj
  if (typeof obj === 'string') return sanitizeHtml(obj)
  if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item))
  if (typeof obj === 'object') {
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  return obj
}