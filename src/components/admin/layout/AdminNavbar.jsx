import React from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useAdminAuth } from '../../../hooks/useAdminAuth'

const AdminNavbar = ({ setSidebarOpen }) => {
  const { adminUser, adminProfile, adminRole } = useAdminAuth()

  return (
    <div className="sticky top-0 z-10 shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" />
      </button>
      
      <div className="flex-1 flex justify-between px-4">
        <div className="flex-1 flex items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Welcome back, {adminProfile?.full_name || adminUser?.email?.split('@')[0] || 'Admin'}
          </h2>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* Role badge */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
            {adminRole?.role?.replace('_', ' ') || 'Admin'}
          </span>
          
          {/* User avatar */}
          <div className="ml-3 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
            {adminUser?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminNavbar