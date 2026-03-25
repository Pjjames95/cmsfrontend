import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useSessionManager = () => {
  const navigate = useNavigate()
  const [showWarning, setShowWarning] = useState(false)
  const [warningToastId, setWarningToastId] = useState(null)
  const sessionTimeoutRef = useRef(null)
  const warningTimeoutRef = useRef(null)
  const activityCheckIntervalRef = useRef(null)
  const lastActivityRef = useRef(Date.now())
  const isExtendingRef = useRef(false)
  
  // Session configuration
  const SESSION_DURATION = 20 * 60 * 1000 // 30 minutes
  const WARNING_BEFORE = 5 * 60 * 1000 // 5 minutes before expiry

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
      sessionTimeoutRef.current = null
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = null
    }
    if (activityCheckIntervalRef.current) {
      clearInterval(activityCheckIntervalRef.current)
      activityCheckIntervalRef.current = null
    }
  }, [])

  // Dismiss warning toast
  const dismissWarningToast = useCallback(() => {
    if (warningToastId) {
      toast.dismiss(warningToastId)
      setWarningToastId(null)
    }
  }, [warningToastId])

  // Show warning toast (only once)
  const showWarningToast = useCallback(() => {
    // Dismiss any existing warning toast first
    dismissWarningToast()
    
    const toastId = toast((t) => (
      <div className="flex flex-col space-y-3 min-w-75">
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium text-gray-900">Session expiring soon</p>
        </div>
        <p className="text-sm text-gray-600">Your session will expire in 5 minutes due to inactivity.</p>
        <div className="flex space-x-2 pt-2">
          <button
            className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => {
              extendSession()
              toast.dismiss(t.id)
            }}
          >
            Stay Logged In
          </button>
          <button
            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={() => {
              handleLogout()
              toast.dismiss(t.id)
            }}
          >
            Logout
          </button>
        </div>
      </div>
    ), {
      duration: WARNING_BEFORE,
      position: 'top-center',
      id: 'session-warning', // Fixed ID to prevent duplicates
    })
    
    setWarningToastId(toastId)
    setShowWarning(true)
  }, [dismissWarningToast, WARNING_BEFORE])

  // Handle session expiry
  const handleSessionExpiry = useCallback(async () => {
    // Clear all timers first
    clearAllTimers()
    dismissWarningToast()
    setShowWarning(false)
    
    // Check if already logged out
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    
    toast.error('Your session has expired. Please login again.', {
      duration: 5000,
      id: 'session-expired',
    })
    
    await supabase.auth.signOut()
    navigate('/admin/login', { 
      state: { 
        message: 'Session expired. Please login again.',
        from: window.location.pathname 
      },
      replace: true
    })
  }, [clearAllTimers, dismissWarningToast, navigate])

  // Handle logout
  const handleLogout = useCallback(async () => {
    clearAllTimers()
    dismissWarningToast()
    setShowWarning(false)
    
    await supabase.auth.signOut()
    navigate('/')
    toast.success('Logged out successfully', { id: 'logout-success' })
  }, [clearAllTimers, dismissWarningToast, navigate])

  // Extend session
  const extendSession = useCallback(() => {
    if (isExtendingRef.current) return // Prevent multiple extends
    isExtendingRef.current = true
    
    clearAllTimers()
    dismissWarningToast()
    setShowWarning(false)
    lastActivityRef.current = Date.now()
    
    // Reset timers
    startTimers()
    
    toast.success('Session extended', { 
      duration: 3000,
      id: 'session-extended' 
    })
    
    setTimeout(() => {
      isExtendingRef.current = false
    }, 1000)
  }, [clearAllTimers, dismissWarningToast])

  // Start session timers
  const startTimers = useCallback(() => {
    clearAllTimers() // Clear existing timers first
    
    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      showWarningToast()
    }, SESSION_DURATION - WARNING_BEFORE)
    
    // Set expiry timer
    sessionTimeoutRef.current = setTimeout(() => {
      handleSessionExpiry()
    }, SESSION_DURATION)
  }, [clearAllTimers, SESSION_DURATION, WARNING_BEFORE, showWarningToast, handleSessionExpiry])

  // Track user activity
  const handleUserActivity = useCallback(() => {
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityRef.current
    
    // Only reset if significant time has passed (prevents excessive resets)
    if (timeSinceLastActivity > 10000) { // 10 seconds threshold
      lastActivityRef.current = now
      startTimers()
    } else {
      lastActivityRef.current = now
    }
  }, [startTimers])

  // Initialize session management
  useEffect(() => {
    // Start timers
    startTimers()
    
    // Set up activity tracking
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove']
    
    activities.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })
    
    // Check authentication periodically
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        handleSessionExpiry()
      }
    }
    
    const authInterval = setInterval(checkAuth, 60000) // Check every minute
    
    // Cleanup on unmount
    return () => {
      activities.forEach(event => {
        window.removeEventListener(event, handleUserActivity)
      })
      clearAllTimers()
      clearInterval(authInterval)
      dismissWarningToast()
    }
  }, [startTimers, handleUserActivity, handleSessionExpiry, clearAllTimers, dismissWarningToast])

  // Check for session on mount
  useEffect(() => {
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        handleSessionExpiry()
      }
    }
    checkInitialSession()
  }, [handleSessionExpiry])

  useEffect(() => {
  const regenerateSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Force token refresh
      await supabase.auth.refreshSession()
    }
  }
  
  // Regenerate session on login
  regenerateSession()
}, [])

  return {
    showWarning,
    extendSession,
    handleLogout
  }
}