import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  UserGroupIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

const MinistryRegistrationsManager = () => {
  const { adminUser } = useAdminAuth()
  const [registrations, setRegistrations] = useState([])
  const [ministries, setMinistries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState('public')
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [ministryFilter, setMinistryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: '⏳', color: 'bg-yellow-100 text-yellow-800', borderColor: 'border-yellow-500' },
    { value: 'approved', label: 'Approved', icon: '✅', color: 'bg-green-100 text-green-800', borderColor: 'border-green-500' },
    { value: 'rejected', label: 'Rejected', icon: '❌', color: 'bg-red-100 text-red-800', borderColor: 'border-red-500' },
    { value: 'waiting_list', label: 'Waiting List', icon: '📋', color: 'bg-blue-100 text-blue-800', borderColor: 'border-blue-500' }
  ]

  useEffect(() => {
    fetchMinistries()
    fetchRegistrations()
  }, [])

  const fetchMinistries = async () => {
    try {
      const { data, error } = await supabase
        .from('ministries')
        .select('id, name')
        .order('name', { ascending: true })
      
      if (error) throw error
      setMinistries(data || [])
    } catch (error) {
      console.error('Error fetching ministries:', error)
      toast.error('Failed to load ministries')
    }
  }

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ministry_registrations')
        .select(`
          *,
          ministry:ministry_id (
            name
          )
        `)
        .order('registration_date', { ascending: false })
      
      if (error) throw error

      const formattedData = data.map(reg => ({
        ...reg,
        ministry_name: reg.ministry?.name || 'Unknown Ministry',
        status_info: statusOptions.find(s => s.value === reg.status) || statusOptions[0]
      }))
      
      setRegistrations(formattedData)
    } catch (error) {
      console.error('Error fetching registrations:', error)
      toast.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (registrationId) => {
    try {
      // First, fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('ministry_registration_comments')
        .select('*')
        .eq('registration_id', registrationId)
        .order('created_at', { ascending: true })
      
      if (commentsError) throw commentsError

      // Then, fetch user details for each comment
      const commentsWithUsers = await Promise.all(
        commentsData.map(async (comment) => {
          if (comment.user_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', comment.user_id)
              .single()
            
            return {
              ...comment,
              user: userData || { email: 'Unknown User' }
            }
          }
          return {
            ...comment,
            user: { email: 'System' }
          }
        })
      )
      
      setComments(commentsWithUsers)
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    }
  }

  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration)
    fetchComments(registration.id)
    setShowDetailsModal(true)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      const commentData = {
        registration_id: selectedRegistration.id,
        user_id: adminUser?.id || null,
        comment: newComment,
        is_internal: commentType === 'internal',
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('ministry_registration_comments')
        .insert([commentData])
        .select()
        .single()

      if (error) {
        console.error('Error adding comment:', error)
        throw error
      }

      toast.success('Comment added successfully')
      setNewComment('')
      
      // Add the new comment to the comments list with user info
      const newCommentWithUser = {
        ...data,
        user: { email: adminUser?.email || 'You' }
      }
      setComments(prev => [...prev, newCommentWithUser])
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    }
  }

  const handleStatusChange = async (registration, newStatus) => {
    try {
      const { error } = await supabase
        .from('ministry_registrations')
        .update({
          status: newStatus,
          approval_date: newStatus === 'approved' ? new Date().toISOString() : null,
          approved_by: newStatus === 'approved' ? adminUser?.id : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', registration.id)
      
      if (error) throw error

      toast.success(`Registration ${newStatus} successfully`)
      fetchRegistrations()
      
      if (selectedRegistration) {
        setSelectedRegistration({
          ...selectedRegistration,
          status: newStatus,
          status_info: statusOptions.find(s => s.value === newStatus)
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (registration) => {
    if (!confirm(`Are you sure you want to delete this registration from ${registration.first_name} ${registration.last_name}?`)) return

    try {
      const { error } = await supabase
        .from('ministry_registrations')
        .delete()
        .eq('id', registration.id)
      
      if (error) throw error
      
      toast.success('Registration deleted successfully')
      fetchRegistrations()
      setShowDetailsModal(false)
    } catch (error) {
      console.error('Error deleting registration:', error)
      toast.error('Failed to delete registration')
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <CheckCircleIconSolid className="h-5 w-5 text-green-500" />
      case 'rejected': return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'waiting_list': return <ClockIcon className="h-5 w-5 text-blue-500" />
      default: return <ClockIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      `${reg.first_name} ${reg.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phone?.includes(searchTerm)
    
    const matchesMinistry = ministryFilter === 'all' || reg.ministry_id === ministryFilter
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
    
    // Date filtering
    let matchesDate = true
    if (dateFilter !== 'all') {
      const regDate = new Date(reg.registration_date)
      const now = new Date()
      const today = new Date(now.setHours(0, 0, 0, 0))
      
      if (dateFilter === 'today') {
        matchesDate = regDate >= today
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        matchesDate = regDate >= weekAgo
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        matchesDate = regDate >= monthAgo
      }
    }
    
    return matchesSearch && matchesMinistry && matchesStatus && matchesDate
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a')
  }

  const formatSimpleDate = (dateString) => {
    if (!dateString) return 'N/A'
    return format(parseISO(dateString), 'MMM d, yyyy')
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
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ministry Registrations</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage member registrations for various ministries, track applications, and communicate with applicants.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-yellow-500 rounded-md p-3">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {registrations.filter(r => r.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-green-500 rounded-md p-3">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {registrations.filter(r => r.status === 'approved').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-blue-500 rounded-md p-3">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Waiting List</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {registrations.filter(r => r.status === 'waiting_list').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-purple-500 rounded-md p-3">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-semibold text-gray-900">{registrations.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 flex items-center space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
            showFilters 
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ministry</label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={ministryFilter}
                onChange={(e) => setMinistryFilter(e.target.value)}
              >
                <option value="all">All Ministries</option>
                {ministries.map(ministry => (
                  <option key={ministry.id} value={ministry.id}>{ministry.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Registration Date</label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Registrations Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Applicant
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Ministry
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Contact
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Registered
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        No registrations found
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 shrink-0">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-indigo-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">
                                {reg.first_name} {reg.last_name}
                              </div>
                              <div className="text-gray-500">{reg.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {reg.ministry_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {reg.phone && (
                            <div className="flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {reg.phone}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reg.status_info.color}`}>
                            <span className="mr-1">{reg.status_info.icon}</span>
                            {reg.status_info.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatSimpleDate(reg.registration_date)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleViewDetails(reg)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            View Details
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

      {/* Details Modal */}
      {showDetailsModal && selectedRegistration && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Registration Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Status Bar */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Current Status:</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedRegistration.status_info.color}`}>
                      <span className="mr-1">{selectedRegistration.status_info.icon}</span>
                      {selectedRegistration.status_info.label}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {selectedRegistration.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusChange(selectedRegistration, 'approved')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                    )}
                    {selectedRegistration.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(selectedRegistration, 'rejected')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    )}
                    {selectedRegistration.status !== 'waiting_list' && (
                      <button
                        onClick={() => handleStatusChange(selectedRegistration, 'waiting_list')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Waiting List
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedRegistration)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Personal Information</h4>
                    <dl className="space-y-2">
                      <div className="flex">
                        <dt className="w-24 text-sm text-gray-500">Name:</dt>
                        <dd className="text-sm text-gray-900">{selectedRegistration.first_name} {selectedRegistration.last_name}</dd>
                      </div>
                      {selectedRegistration.date_of_birth && (
                        <div className="flex">
                          <dt className="w-24 text-sm text-gray-500">Date of Birth:</dt>
                          <dd className="text-sm text-gray-900">{formatSimpleDate(selectedRegistration.date_of_birth)}</dd>
                        </div>
                      )}
                      <div className="flex">
                        <dt className="w-24 text-sm text-gray-500">Email:</dt>
                        <dd className="text-sm text-gray-900">
                          <a href={`mailto:${selectedRegistration.email}`} className="text-indigo-600 hover:text-indigo-800">
                            {selectedRegistration.email}
                          </a>
                        </dd>
                      </div>
                      {selectedRegistration.phone && (
                        <div className="flex">
                          <dt className="w-24 text-sm text-gray-500">Phone:</dt>
                          <dd className="text-sm text-gray-900">
                            <a href={`tel:${selectedRegistration.phone}`} className="text-indigo-600 hover:text-indigo-800">
                              {selectedRegistration.phone}
                            </a>
                          </dd>
                        </div>
                      )}
                      {selectedRegistration.address && (
                        <div className="flex">
                          <dt className="w-24 text-sm text-gray-500">Address:</dt>
                          <dd className="text-sm text-gray-900">{selectedRegistration.address}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Emergency Contact</h4>
                    <dl className="space-y-2">
                      {selectedRegistration.emergency_contact_name && (
                        <div className="flex">
                          <dt className="w-24 text-sm text-gray-500">Name:</dt>
                          <dd className="text-sm text-gray-900">{selectedRegistration.emergency_contact_name}</dd>
                        </div>
                      )}
                      {selectedRegistration.emergency_contact_phone && (
                        <div className="flex">
                          <dt className="w-24 text-sm text-gray-500">Phone:</dt>
                          <dd className="text-sm text-gray-900">
                            <a href={`tel:${selectedRegistration.emergency_contact_phone}`} className="text-indigo-600 hover:text-indigo-800">
                              {selectedRegistration.emergency_contact_phone}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Ministry Information */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Ministry Information</h4>
                  <dl className="space-y-2">
                    <div className="flex">
                      <dt className="w-32 text-sm text-gray-500">Ministry:</dt>
                      <dd className="text-sm text-gray-900 font-medium">{selectedRegistration.ministry_name}</dd>
                    </div>
                    {selectedRegistration.motivation && (
                      <div>
                        <dt className="text-sm text-gray-500 mb-1">Motivation:</dt>
                        <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedRegistration.motivation}</dd>
                      </div>
                    )}
                    {selectedRegistration.previous_experience && (
                      <div>
                        <dt className="text-sm text-gray-500 mb-1">Previous Experience:</dt>
                        <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedRegistration.previous_experience}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Skills and Availability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                  {selectedRegistration.skills && selectedRegistration.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRegistration.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRegistration.availability && selectedRegistration.availability.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Availability</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRegistration.availability.map((time, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Comments & Communication</h4>
                  
                  {/* Comment Input */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={() => setCommentType('public')}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          commentType === 'public'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Public Comment
                      </button>
                      <button
                        onClick={() => setCommentType('internal')}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          commentType === 'internal'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Internal Note
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder={commentType === 'public' ? "Add a public comment..." : "Add an internal note..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <button
                        onClick={handleAddComment}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-3 rounded-lg ${
                            comment.is_internal
                              ? 'bg-yellow-50 border border-yellow-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-gray-700">
                                {comment.is_internal ? 'Internal Note' : 'Public Comment'}
                              </span>
                              <span className="text-xs text-gray-500">
                                by {comment.user?.email || 'Unknown'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{comment.comment}</p>
                        </div>
    
                      ))
                    )}
                  </div>
                </div>

                {/* Registration Metadata */}
                <div className="border-t pt-4 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Registered: {formatDate(selectedRegistration.registration_date)}</span>
                    {selectedRegistration.approval_date && (
                      <span>Approved: {formatDate(selectedRegistration.approval_date)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MinistryRegistrationsManager