// src/utils/validation.js

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'Email is required'
  if (!emailRegex.test(email)) return 'Please enter a valid email address'
  return null
}

// Phone validation (Kenyan format)
export const validatePhone = (phone) => {
  if (!phone) return null
  const phoneRegex = /^(\+254|0)[7-9][0-9]{8}$/
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Please enter a valid phone number (e.g., 0712345678 or +254712345678)'
  }
  return null
}

// Name validation
export const validateName = (name, fieldName = 'Name') => {
  if (!name || name.trim() === '') return `${fieldName} is required`
  if (name.length < 2) return `${fieldName} must be at least 2 characters`
  if (name.length > 100) return `${fieldName} must be less than 100 characters`
  if (!/^[a-zA-Z\s\-']+$/.test(name)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
  return null
}

// URL validation
export const validateUrl = (url) => {
  if (!url) return null
  try {
    new URL(url)
    return null
  } catch {
    return 'Please enter a valid URL'
  }
}

// Date validation
export const validateDate = (date, fieldName = 'Date') => {
  if (!date) return `${fieldName} is required`
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) return `Please enter a valid ${fieldName}`
  return null
}

// Future date validation
export const validateFutureDate = (date, fieldName = 'Date') => {
  const error = validateDate(date, fieldName)
  if (error) return error
  
  const selectedDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (selectedDate < today) return `${fieldName} cannot be in the past`
  return null
}

// Number validation
export const validateNumber = (value, fieldName = 'Value', min = null, max = null) => {
  if (!value && value !== 0) return `${fieldName} is required`
  const num = parseFloat(value)
  if (isNaN(num)) return `${fieldName} must be a valid number`
  if (min !== null && num < min) return `${fieldName} must be at least ${min}`
  if (max !== null && num > max) return `${fieldName} must be at most ${max}`
  return null
}

// Text length validation
export const validateLength = (text, fieldName = 'Text', min = 0, max = 5000) => {
  if (!text) return null
  if (text.length < min) return `${fieldName} must be at least ${min} characters`
  if (text.length > max) return `${fieldName} must be less than ${max} characters`
  return null
}

// Password validation
export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  return null
}

// Confirm password validation
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password'
  if (password !== confirmPassword) return 'Passwords do not match'
  return null
}

// Ministry registration specific validation
export const validateMinistryRegistration = (data) => {
  const errors = {}
  
  errors.first_name = validateName(data.first_name, 'First name')
  errors.last_name = validateName(data.last_name, 'Last name')
  errors.email = validateEmail(data.email)
  errors.phone = validatePhone(data.phone)
  errors.motivation = validateLength(data.motivation, 'Motivation', 50, 2000)
  
  if (data.date_of_birth) {
    errors.date_of_birth = validateDate(data.date_of_birth, 'Date of birth')
  }
  
  // Remove null/undefined errors
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Sermon validation
export const validateSermon = (data) => {
  const errors = {}
  
  errors.title = validateName(data.title, 'Title')
  errors.speaker = validateName(data.speaker, 'Speaker name')
  errors.date_preached = validateDate(data.date_preached, 'Date preached')
  
  if (data.bible_passage) {
    errors.bible_passage = validateLength(data.bible_passage, 'Bible passage', 0, 200)
  }
  
  if (data.duration) {
    errors.duration = validateNumber(data.duration, 'Duration', 1, 600)
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Ministry validation
export const validateMinistry = (data) => {
  const errors = {}
  
  errors.name = validateName(data.name, 'Ministry name')
  
  if (data.contact_email) {
    errors.contact_email = validateEmail(data.contact_email)
  }
  
  if (data.contact_phone) {
    errors.contact_phone = validatePhone(data.contact_phone)
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Project validation
export const validateProject = (data) => {
  const errors = {}
  
  errors.name = validateName(data.name, 'Project name')
  errors.progress = validateNumber(data.progress, 'Progress', 0, 100)
  
  if (data.budget) {
    errors.budget = validateNumber(data.budget, 'Budget', 0)
  }
  
  if (data.raised_amount) {
    errors.raised_amount = validateNumber(data.raised_amount, 'Raised amount', 0)
  }
  
  if (data.start_date) {
    errors.start_date = validateDate(data.start_date, 'Start date')
  }
  
  if (data.end_date) {
    errors.end_date = validateDate(data.end_date, 'End date')
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// News validation
export const validateNews = (data) => {
  const errors = {}
  
  errors.title = validateName(data.title, 'Title')
  errors.content = validateLength(data.content, 'Content', 10, 50000)
  
  if (data.summary) {
    errors.summary = validateLength(data.summary, 'Summary', 0, 500)
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Service Program validation
export const validateServiceProgram = (data) => {
  const errors = {}
  
  errors.title = validateName(data.title, 'Service title')
  errors.service_date = validateDate(data.service_date, 'Service date')
  errors.start_time = validateTime(data.start_time)
  
  if (data.location) {
    errors.location = validateLength(data.location, 'Location', 0, 200)
  }
  
  if (data.online_link) {
    errors.online_link = validateUrl(data.online_link)
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Time validation
export const validateTime = (time) => {
  if (!time) return 'Time is required'
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(time)) return 'Please enter a valid time (HH:MM)'
  return null
}

// Financial transaction validation
export const validateTransaction = (data) => {
  const errors = {}
  
  errors.description = validateLength(data.description, 'Description', 3, 500)
  errors.amount = validateNumber(data.amount, 'Amount', 0.01)
  errors.transaction_date = validateDate(data.transaction_date, 'Transaction date')
  
  if (data.reference_number) {
    errors.reference_number = validateLength(data.reference_number, 'Reference number', 0, 50)
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Choir member validation
export const validateChoirMember = (data) => {
  const errors = {}
  
  errors.first_name = validateName(data.first_name, 'First name')
  errors.last_name = validateName(data.last_name, 'Last name')
  errors.join_date = validateDate(data.join_date, 'Join date')
  
  if (data.email) {
    errors.email = validateEmail(data.email)
  }
  
  if (data.phone) {
    errors.phone = validatePhone(data.phone)
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}

// Contact form validation
export const validateContactForm = (data) => {
  const errors = {}
  
  errors.name = validateName(data.name, 'Name')
  errors.email = validateEmail(data.email)
  errors.subject = validateLength(data.subject, 'Subject', 3, 200)
  errors.message = validateLength(data.message, 'Message', 10, 5000)
  
  if (data.phone) {
    errors.phone = validatePhone(data.phone)
  }
  
  return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null))
}