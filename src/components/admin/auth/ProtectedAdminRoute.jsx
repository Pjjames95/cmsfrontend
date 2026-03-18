import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import LoadingSpinner from '../../common/LoadingSpinner'

const ProtectedAdminRoute = ({ children, requiredRole = null }) => {
  const { adminUser, adminRole, loading, isAdmin, hasRole } = useAdminAuth()
  const location = useLocation()

  console.log('Protected route check:', { 
    adminUser: adminUser?.email, 
    adminRole: adminRole?.role,
    loading, 
    isAdmin,
    requiredRole 
  })

  if (loading) {
    return <LoadingSpinner />
  }

  // Redirect to login if not authenticated
  if (!adminUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Check for specific role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    console.log(`Access denied: Required role ${requiredRole}, but user has ${adminRole?.role}`)
    return <Navigate to="/admin/unauthorized" replace />
  }

  // User is authenticated and has required role (if any)
  return children
}

export default ProtectedAdminRoute