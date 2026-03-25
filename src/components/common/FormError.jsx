// src/components/common/FormError.jsx
import React from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

const FormError = ({ error }) => {
  if (!error) return null
  
  return (
    <div className="mt-1 text-sm text-red-600 flex items-center">
      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
      {error}
    </div>
  )
}

export default FormError