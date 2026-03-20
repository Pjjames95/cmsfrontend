import React from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'

const SessionWarningModal = ({ onExtend, onLogout }) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <ClockIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Session Expiring Soon
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Your session will expire in 5 minutes due to inactivity. 
            Would you like to stay logged in?
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onExtend}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Stay Logged In
            </button>
            <button
              onClick={onLogout}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionWarningModal