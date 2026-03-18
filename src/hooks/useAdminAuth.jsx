import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AdminAuthContext = createContext({})

export const useAdminAuth = () => useContext(AdminAuthContext)

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null)
  const [adminProfile, setAdminProfile] = useState(null)
  const [adminRole, setAdminRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email)
      if (session?.user) {
        setAdminUser(session.user)
        fetchAdminProfile(session.user.id)
        fetchAdminRole(session.user.id)
      } else {
        setAdminUser(null)
        setAdminProfile(null)
        setAdminRole(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user?.email)
      
      if (user) {
        setAdminUser(user)
        await fetchAdminProfile(user.id)
        await fetchAdminRole(user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminProfile = async (userId) => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching profile:', error)
        return
      }
      
      console.log('Profile data:', data)
      setAdminProfile(data)
    } catch (error) {
      console.error('Exception fetching profile:', error)
    }
  }

  const fetchAdminRole = async (userId) => {
    try {
      console.log('Fetching role for user:', userId)
      
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching role:', error)
        return
      }
      
      console.log('Role data:', data)
      
      // Transform the data to have role_name for consistency
      if (data) {
        // Your table uses 'role' column, so we'll map it to role_name
        const transformedData = {
          ...data,
          role_name: data.role // Map 'role' to 'role_name'
        }
        setAdminRole(transformedData)
      } else {
        setAdminRole(null)
      }
    } catch (error) {
      console.error('Exception fetching role:', error)
    }
  }

  const signIn = async (email, password) => {
    try {
      console.log('Attempting sign in for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        throw error
      }

      console.log('Sign in successful:', data.user.email)
      
      // Fetch role after sign in
      if (data.user) {
        await fetchAdminRole(data.user.id)
      }

      toast.success('Welcome back!')
      return { success: true, role: adminRole?.role || 'unknown' }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully')
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Error signing out')
      return { success: false, error: error.message }
    }
  }

  // Check if user has specific role
  const hasRole = (requiredRole) => {
    if (!adminRole) return false
    if (adminRole.role === 'dean') return true // Super admin has all access
    return adminRole.role === requiredRole
  }

  const value = {
    adminUser,
    adminProfile,
    adminRole,
    loading,
    signIn,
    signOut,
    isAdmin: !!adminRole, // User is admin if they have a role assigned
    isSuperAdmin: adminRole?.role === 'dean',
    hasRole
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}