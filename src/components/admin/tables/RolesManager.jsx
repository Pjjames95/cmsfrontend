import React, { useState, useEffect } from 'react'
import { supabase, sanitizedDb } from '../../../lib/supabaseClient'
import { publicAPI } from '../../../lib/publicAPI'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { adminSupabase } from '../../../lib/adminSupabase'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  ShieldCheckIcon,
  UserPlusIcon,
  EnvelopeIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const RolesManager = () => {
  const { adminRole, adminUser } = useAdminAuth()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'form'

  

  const roleOptions = [
    { value: 'dean', label: 'Super Admin', description: 'Full system access' },
    { value: 'admin', label: 'Admin', description: 'Administrative access' },
    { value: 'media_admin', label: 'Media Admin', description: 'Manage sermons, hymns, news' },
    { value: 'financials_admin', label: 'Finance Admin', description: 'Manage financials' },
    { value: 'ministries_admin', label: 'Ministry Leader', description: 'Manage ministries' },
    { value: 'secretary_admin', label: 'Secretary', description: 'Manage service programs' },
    { value: 'projects_admin', label: 'Project Manager', description: 'Manage projects' },
    { value: 'choir_admin', label: 'Choir Leader', description: 'Manage choir history' },
    { value: 'member', label: 'Member', description: 'Basic member access' }
  ]

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // For each role, try to get user details from profiles if available
      const rolesWithDetails = await Promise.all(
        data.map(async (role) => {
          // Try to get user details from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', role.user_id)
            .maybeSingle()

          return {
            ...role,
            user_email: profile?.email || role.user_email || 'Email not set',
            user_name: profile?.full_name || role.user_name || 'Name not set'
          }
        })
      )
      
      setRoles(rolesWithDetails)
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingRole(null)
    setViewMode('form')
    setShowModal(true)
  }

  const handleEdit = (role) => {
    setEditingRole(role)
    setViewMode('form')
    setShowModal(true)
  }

  const handleDelete = async (role) => {
    if (!confirm(`Are you sure you want to delete the role for ${role.user_name}?`)) return

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', role.id)
      
      if (error) throw error
      
      toast.success('Role deleted successfully')
      fetchRoles()
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error('Failed to delete role')
    }
  }

  const handleSubmit = async (formData) => {
  try {
    console.log('Submitting form data:', formData)
    
    let userId = formData.user_id

    if (!userId) {
      // First, check if user exists in auth by email
      const { data: existingAuthUser, error: authCheckError } = await adminSupabase.auth
        .admin
        .listUsers()
      
      const existingUser = existingAuthUser?.users?.find(u => u.email === formData.email)

      if (existingUser) {
        userId = existingUser.id
        console.log('User already exists in auth:', userId)
      } else {
        // Create the user in Supabase Auth
        console.log('Creating auth user...')
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: formData.full_name
          }
        })

        console.log('Auth creation result:', { authData, authError })

        if (authError) throw authError
        
        userId = authData.user.id
        toast.success('User account created successfully')
      }

      // Now create or update the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: formData.email,
          full_name: formData.full_name,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single()

      console.log('Profile upsert result:', { profile, profileError })

      if (profileError) throw profileError
    }

    if (editingRole) {
      // Update existing role
      const { data, error } = await supabase
        .from('roles')
        .update({ 
          role: formData.role,
          user_name: formData.full_name,
          user_email: formData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRole.id)
        .select()
      
      console.log('Role update result:', { data, error })
      
      if (error) throw error
      toast.success('Role updated successfully')
    } else {
      // Check if user already has a role
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (existingRole) {
        toast.error('User already has a role assigned')
        return
      }

      // Create new role
      const { data, error } = await supabase
        .from('roles')
        .insert([{
          user_id: userId,
          user_email: formData.email,
          user_name: formData.full_name,
          role: formData.role,
          assigned_by: adminUser?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
      
      console.log('Role creation result:', { data, error })
      
      if (error) throw error
      toast.success('Role assigned successfully')
    }
    
    setShowModal(false)
    fetchRoles()
  } catch (error) {
    console.error('Error saving role:', error)
    
    if (error.message?.includes('row-level security')) {
      toast.error('Permission denied. Please check your database access rights.')
    } else if (error.message?.includes('duplicate key')) {
      toast.error('A user with this email already exists')
    } else {
      toast.error('Failed to save role: ' + (error.message || 'Unknown error'))
    }
  }
}

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Role Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Assign and manage user roles. Add user details manually when assigning new roles.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Assign New Role
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <div className="flex rounded-md shadow-sm">
          <input
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Email
                    </th>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Role
                    </th>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Assigned On
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                        No roles found. Click "Assign New Role" to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {role.user_name}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                          {role.user_email}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            role.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            role.role === 'dean' ? 'bg-red-100 text-red-800' :
                            role.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            role.role === 'media_admin' ? 'bg-yellow-100 text-yellow-800' :
                            role.role === 'finance_admin' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {roleOptions.find(r => r.value === role.role)?.label || role.role}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                          {formatDate(role.created_at)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleEdit(role)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            title="Edit role"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(role)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete role"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {showModal && (
        <RoleModal
          role={editingRole}
          roleOptions={roleOptions}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// Enhanced Role Modal Component
// Role Modal Component with Password
const RoleModal = ({ role, roleOptions, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    full_name: role?.user_name || '',
    email: role?.user_email || '',
    role: role?.role || 'member',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate passwords for new users
    if (!role && formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    if (!role && formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    
    setPasswordError('')
    setLoading(true)
    await onSubmit(formData)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            {role ? 'Edit Role' : 'Assign New Role'}
          </h3>
          <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <UserIcon className="h-4 w-4 inline mr-1" />
              Full Name
            </label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <EnvelopeIcon className="h-4 w-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="user@example.com"
              required
              disabled={!!role} // Disable email editing for existing roles
            />
          </div>

          {/* Password Fields - Only show for new users */}
          {!role && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirm password"
                  required
                  minLength={6}
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                )}
              </div>
            </>
          )}
          
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
            >
              {roleOptions.map(roleOption => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label} - {roleOption.description}
                </option>
              ))}
            </select>
          </div>
          
          {/* Info message */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="shrink-0">
                <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {!role ? 
                    'The user will be created with a secure account. They can login using their email and password.' :
                    'Update the role and details for this user.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (role ? 'Update Role' : 'Create User & Assign Role')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RolesManager