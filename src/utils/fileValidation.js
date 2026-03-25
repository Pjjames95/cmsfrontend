export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB
  audio: 50 * 1024 * 1024,     // 50MB
  document: 20 * 1024 * 1024,   // 20MB
  pdf: 20 * 1024 * 1024,        // 20MB
  hymn: 50 * 1024 * 1024,       // 50MB
  default: 10 * 1024 * 1024     // 10MB
}

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  pdf: ['application/pdf'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text'
  ],
  hymn: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/epub+zip',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
}

// File signatures for verification (magic numbers)
const FILE_SIGNATURES = {
  'pdf': [0x25, 0x50, 0x44, 0x46],           // %PDF
  'jpg': [0xFF, 0xD8, 0xFF],                 // ÿØÿ
  'jpeg': [0xFF, 0xD8, 0xFF],                // ÿØÿ
  'png': [0x89, 0x50, 0x4E, 0x47],           // ‰PNG
  'gif': [0x47, 0x49, 0x46, 0x38],           // GIF8
  'mp3': [0xFF, 0xFB],                        // ÿû
  'docx': [0x50, 0x4B, 0x03, 0x04]           // PK
}

// Verify file signature (magic number)
export const verifyFileSignature = async (file, expectedType) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = (e) => {
      const arr = new Uint8Array(e.target.result).subarray(0, 8)
      
      // Check against known signatures
      let isValid = false
      for (const [type, magic] of Object.entries(FILE_SIGNATURES)) {
        let match = true
        for (let i = 0; i < magic.length && i < arr.length; i++) {
          if (arr[i] !== magic[i]) {
            match = false
            break
          }
        }
        if (match) {
          isValid = true
          break
        }
      }
      
      resolve(isValid)
    }
    reader.readAsArrayBuffer(file.slice(0, 8))
  })
}

// Validate file
export const validateFile = async (file, type, options = {}) => {
  const errors = []
  
  // Check if file exists
  if (!file) {
    errors.push('No file selected')
    return { isValid: false, errors }
  }
  
  // Get allowed types and size limit
  const allowedTypes = options.allowedTypes || ALLOWED_MIME_TYPES[type] || ALLOWED_MIME_TYPES.default
  const sizeLimit = options.sizeLimit || FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.default
  
  // Check file size
  if (file.size > sizeLimit) {
    errors.push(`File too large. Maximum size is ${sizeLimit / (1024 * 1024)}MB`)
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes.map(t => t.split('/')[1]).join(', ')
    errors.push(`Invalid file type. Allowed: ${allowedExtensions}`)
  }
  
  // Check file extension
  const extension = file.name.split('.').pop().toLowerCase()
  const allowedExtensions = options.allowedExtensions || allowedTypes.map(t => t.split('/')[1])
  if (!allowedExtensions.includes(extension)) {
    errors.push(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`)
  }
  
  // Verify file signature (optional, for critical files)
  if (options.verifySignature && !options.skipSignature) {
    const isValid = await verifyFileSignature(file, type)
    if (!isValid) {
      errors.push('File appears to be corrupted or tampered with')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Sanitize filename
export const sanitizeFilename = (filename) => {
  if (!filename) return 'file'
  // Remove path traversal attempts and dangerous characters
  const sanitized = filename.replace(/[^a-zA-Z0-9.\-_]/g, '')
  return sanitized || 'file'
}

// Generate safe filename
export const generateSafeFilename = (originalName) => {
  const extension = originalName.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}.${extension}`
}