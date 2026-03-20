import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useSessionManager } from '../../../hooks/useSessionManager'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import SessionWarningModal from '../auth/SessionWarningModal'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { showWarning, extendSession, handleLogout } = useSessionManager()

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <AdminNavbar setSidebarOpen={setSidebarOpen} />
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Session Warning Modal */}
      {showWarning && (
        <SessionWarningModal
          onExtend={extendSession}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default AdminLayout