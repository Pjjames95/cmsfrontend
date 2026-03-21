import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PhotoIcon,
  EyeIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns'

const ServiceProgramManager = () => {
  const { adminUser } = useAdminAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('upcoming')
  const [showFilters, setShowFilters] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  
  // Refs for scrolling
  const topRef = useRef(null)
  const bottomRef = useRef(null)
  const contentRef = useRef(null)

  // File upload states
  const [imageFile, setImageFile] = useState(null)
  const [bulletinFile, setBulletinFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const serviceTypes = [
    { value: 'fsunday_service', label: 'First Sunday Service', icon: '⛪', color: 'bg-purple-100 text-purple-800' },
    { value: 'sunday_service', label: 'Second Sunday Service', icon: '⛪', color: 'bg-purple-100 text-purple-800' },
    { value: 'wednesday_service', label: 'Wednesday Service', icon: '📖', color: 'bg-blue-100 text-blue-800' },
    { value: 'prayer_meeting', label: 'Prayer Meeting', icon: '🙏', color: 'bg-green-100 text-green-800' },
    { value: 'bible_study', label: 'Bible Study', icon: '📚', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'special_event', label: 'Special Event', icon: '🎉', color: 'bg-pink-100 text-pink-800' },
    { value: 'youth_service', label: 'Youth Service', icon: '🌟', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'children_service', label: 'Children\'s Service', icon: '🧸', color: 'bg-orange-100 text-orange-800' },
    { value: 'other', label: 'Other', icon: '📅', color: 'bg-gray-100 text-gray-800' }
  ]

  useEffect(() => {
    fetchServices()
  }, [])

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100
        setScrollProgress(progress)
      }
    }

    const currentRef = contentRef.current
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll)
      return () => currentRef.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('service_programs')
        .select('*')
        .order('service_date', { ascending: true })
        .order('start_time', { ascending: true })
      
      if (error) throw error

      // Format the data
      const formattedData = data.map(service => ({
        ...service,
        service_type_info: serviceTypes.find(t => t.value === service.service_type) || serviceTypes[7]
      }))
      
      setServices(formattedData)
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingService(null)
    setImagePreview(null)
    setImageFile(null)
    setBulletinFile(null)
    setShowModal(true)
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setImagePreview(service.image_url)
    setImageFile(null)
    setBulletinFile(null)
    setShowModal(true)
  }

  const handleDelete = async (service) => {
    if (!confirm(`Are you sure you want to delete the service "${service.title}"?`)) return

    try {
      // Delete associated files
      const filesToDelete = []
      if (service.image_url) filesToDelete.push(service.image_url.split('/').pop())
      if (service.bulletin_url) filesToDelete.push(service.bulletin_url.split('/').pop())

      if (filesToDelete.length > 0) {
        await supabase.storage
          .from('service-images')
          .remove(filesToDelete)
      }

      const { error } = await supabase
        .from('service_programs')
        .delete()
        .eq('id', service.id)
      
      if (error) throw error
      
      toast.success('Service deleted successfully')
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Failed to delete service')
    }
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    switch(type) {
      case 'image':
        setImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result)
        }
        reader.readAsDataURL(file)
        break
      case 'bulletin':
        setBulletinFile(file)
        break
    }
  }

  const uploadFile = async (file, bucket, folder) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error(`Error uploading to ${bucket}:`, error)
      throw error
    }
  }

  const handleSubmit = async (formData) => {
    try {
      let imageUrl = editingService?.image_url || null
      let bulletinUrl = editingService?.bulletin_url || null

      // Upload new files if selected
      if (imageFile) {
        if (editingService?.image_url) {
          const oldPath = editingService.image_url.split('/').pop()
          await supabase.storage
            .from('service-images')
            .remove([oldPath])
        }
        imageUrl = await uploadFile(imageFile, 'service-images', 'images')
      }
      
      if (bulletinFile) {
        if (editingService?.bulletin_url) {
          const oldPath = editingService.bulletin_url.split('/').pop()
          await supabase.storage
            .from('service-bulletins')
            .remove([oldPath])
        }
        bulletinUrl = await uploadFile(bulletinFile, 'service-bulletins', 'bulletins')
      }

      // Handle musicians array
      const musicians = formData.musicians 
        ? formData.musicians.split(',').map(m => m.trim()).filter(m => m)
        : []

      // Handle songs array
      const songs = formData.songs 
        ? formData.songs.split('\n').map(s => s.trim()).filter(s => s)
        : []

      const serviceData = {
        title: formData.title,
        description: formData.description,
        service_date: formData.service_date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        service_type: formData.service_type,
        series: formData.series || null,
        speaker: formData.speaker || null, // Just use text input
        location: formData.location || null,
        is_online: formData.is_online || false,
        online_link: formData.is_online ? formData.online_link : null,
        image_url: imageUrl,
        bulletin_url: bulletinUrl,
        worship_leader: formData.worship_leader || null,
        musicians: musicians,
        songs: songs,
        notes: formData.notes || null,
        is_published: formData.is_published || false,
        is_featured: formData.is_featured || false,
        updated_at: new Date().toISOString()
      }

      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('service_programs')
          .update(serviceData)
          .eq('id', editingService.id)
        
        if (error) throw error
        toast.success('Service updated successfully')
      } else {
        // Create new service
        const { error } = await supabase
          .from('service_programs')
          .insert([{
            ...serviceData,
            created_by: adminUser?.id,
            created_at: new Date().toISOString(),
            view_count: 0
          }])
        
        if (error) throw error
        toast.success('Service created successfully')
      }
      
      setShowModal(false)
      fetchServices()
      
      // Scroll to top after adding/editing
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error saving service:', error)
      toast.error('Failed to save service: ' + (error.message || 'Unknown error'))
    }
  }

  const togglePublish = async (service) => {
    try {
      const { error } = await supabase
        .from('service_programs')
        .update({ 
          is_published: !service.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id)
      
      if (error) throw error
      
      toast.success(`Service ${service.is_published ? 'unpublished' : 'published'} successfully`)
      fetchServices()
    } catch (error) {
      console.error('Error toggling publish status:', error)
      toast.error('Failed to update service status')
    }
  }

  const toggleFeatured = async (service) => {
    try {
      const { error } = await supabase
        .from('service_programs')
        .update({ 
          is_featured: !service.is_featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id)
      
      if (error) throw error
      
      toast.success(`Service ${service.is_featured ? 'removed from' : 'added to'} featured`)
      fetchServices()
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast.error('Failed to update featured status')
    }
  }

  // Scroll functions
  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.speaker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.series?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || service.service_type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && service.is_published) ||
      (statusFilter === 'draft' && !service.is_published)
    
    // Date filtering
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const serviceDate = new Date(service.service_date)
    
    let matchesDate = true
    if (dateFilter === 'upcoming') {
      matchesDate = serviceDate >= today
    } else if (dateFilter === 'past') {
      matchesDate = serviceDate < today
    } else if (dateFilter === 'today') {
      matchesDate = serviceDate.toDateString() === today.toDateString()
    } else if (dateFilter === 'week') {
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      matchesDate = serviceDate >= today && serviceDate <= nextWeek
    } else if (dateFilter === 'month') {
      matchesDate = serviceDate.getMonth() === today.getMonth() && 
                    serviceDate.getFullYear() === today.getFullYear()
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = parseISO(dateString)
    if (isToday(date)) return 'Today'
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    return timeString.substring(0, 5) // Returns HH:MM
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div 
      ref={contentRef}
      className="h-screen overflow-y-auto relative scroll-smooth"
    >
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating Scroll Buttons */}
      <div className="fixed right-6 bottom-6 z-50 flex flex-col space-y-2">
        <button
          onClick={scrollToTop}
          className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          title="Scroll to top"
        >
          <ArrowUpIcon className="h-5 w-5" />
        </button>
        <button
          onClick={scrollToBottom}
          className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          title="Scroll to bottom"
        >
          <ArrowDownIcon className="h-5 w-5" />
        </button>
      </div>

      <div ref={topRef} className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Service Program Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Schedule and manage church services, events, and programs.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleAdd}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Schedule Service
            </button>
          </div>
        </div>

        {/* Search and Filter Toggle */}
        <div className="mb-4 flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search services..."
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
            {(typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'upcoming') && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Service Type</label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {serviceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="past">Past Services</option>
                  <option value="all">All Dates</option>
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
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setTypeFilter('all')
                    setDateFilter('upcoming')
                    setStatusFilter('all')
                    setSearchTerm('')
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500">
          Showing {filteredServices.length} of {services.length} services
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by scheduling a new service.
              </p>
              <button
                onClick={handleAdd}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Schedule Service
              </button>
            </div>
          ) : (
            filteredServices.map((service) => {
              const serviceDate = parseISO(service.service_date)
              const isUpcoming = isFuture(serviceDate) || isToday(serviceDate)
              
              return (
                <div
                  key={service.id}
                  className={`bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 ${
                    isUpcoming ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Type Badge and Featured */}
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.service_type_info.color}`}>
                            <span className="mr-1">{service.service_type_info.icon}</span>
                            {service.service_type_info.label}
                          </span>
                          {service.is_featured && (
                            <span className="inline-flex items-center text-xs font-medium text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full">
                              <StarIconSolid className="h-3 w-3 mr-1" />
                              Featured
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            service.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {service.is_published ? 'Published' : 'Draft'}
                          </span>
                          {isToday(serviceDate) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Title and Series */}
                        <h3 className="text-xl font-semibold text-gray-900">{service.title}</h3>
                        {service.series && (
                          <p className="text-sm text-indigo-600 mt-1 font-medium">{service.series}</p>
                        )}

                        {/* Date and Time */}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <span className={isToday(serviceDate) ? 'font-semibold text-red-600' : ''}>
                              {formatDate(service.service_date)}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {formatTime(service.start_time)}
                            {service.end_time && ` - ${formatTime(service.end_time)}`}
                          </div>
                        </div>

                        {/* Speaker and Location */}
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {service.speaker && (
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="font-medium">{service.speaker}</span>
                            </div>
                          )}
                          {service.location && (
                            <div className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {service.location}
                            </div>
                          )}
                          {service.is_online && service.online_link && (
                            <div className="flex items-center">
                              <VideoCameraIcon className="h-4 w-4 mr-1 text-gray-400" />
                              <a 
                                href={service.online_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Join Online
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {service.description && (
                          <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                            {service.description}
                          </p>
                        )}

                        {/* Worship Team */}
                        {(service.worship_leader || service.musicians?.length > 0) && (
                          <div className="mt-3 flex items-center text-sm text-gray-600">
                            <MusicalNoteIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="font-medium mr-1">Worship:</span>
                            {service.worship_leader && <span>{service.worship_leader}</span>}
                            {service.musicians?.length > 0 && (
                              <span className="text-gray-500 ml-1">
                                with {service.musicians.join(', ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Songs Preview */}
                        {service.songs?.length > 0 && (
                          <div className="mt-2 text-sm text-gray-500">
                            <span className="font-medium">Songs:</span>{' '}
                            {service.songs.slice(0, 3).join(' • ')}
                            {service.songs.length > 3 && ' • ...'}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="ml-4 flex items-start space-x-2">
                        {service.bulletin_url && (
                          <a
                            href={service.bulletin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                            title="View Bulletin"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DocumentTextIcon className="h-5 w-5" />
                          </a>
                        )}
                        <button
                          onClick={() => toggleFeatured(service)}
                          className={`p-2 rounded-full transition-colors ${
                            service.is_featured 
                              ? 'text-yellow-600 hover:bg-yellow-50' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                          title={service.is_featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          <StarIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => togglePublish(service)}
                          className={`p-2 rounded-full transition-colors ${
                            service.is_published 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                          title={service.is_published ? 'Unpublish' : 'Publish'}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                          title="Edit service"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete service"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Bottom Ref for Scrolling */}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Service Modal */}
      {showModal && (
        <ServiceModal
          service={editingService}
          serviceTypes={serviceTypes}
          imagePreview={imagePreview}
          onImageChange={(e) => handleFileChange(e, 'image')}
          onBulletinChange={(e) => handleFileChange(e, 'bulletin')}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// Service Modal Component
const ServiceModal = ({ service, serviceTypes, imagePreview, onImageChange, onBulletinChange, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: service?.title || '',
    description: service?.description || '',
    service_date: service?.service_date || new Date().toISOString().split('T')[0],
    start_time: service?.start_time || '09:00',
    end_time: service?.end_time || '',
    service_type: service?.service_type || 'sunday_service',
    series: service?.series || '',
    speaker: service?.speaker || '',
    location: service?.location || '',
    is_online: service?.is_online || false,
    online_link: service?.online_link || '',
    worship_leader: service?.worship_leader || '',
    musicians: service?.musicians?.join(', ') || '',
    songs: service?.songs?.join('\n') || '',
    notes: service?.notes || '',
    is_published: service?.is_published ?? true,
    is_featured: service?.is_featured ?? false
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(formData)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            {service ? 'Edit Service' : 'Schedule New Service'}
          </h3>
          <CalendarIcon className="h-6 w-6 text-indigo-600" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Basic Info - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Title *
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type *
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.service_type}
                onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                required
              >
                {serviceTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Series */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Series (Optional)
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.series}
                onChange={(e) => setFormData({...formData, series: e.target.value})}
                placeholder="e.g., Summer Series 2024"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.service_date}
                onChange={(e) => setFormData({...formData, service_date: e.target.value})}
                required
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>

            {/* Speaker - Text Input Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speaker
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.speaker}
                onChange={(e) => setFormData({...formData, speaker: e.target.value})}
                placeholder="Enter speaker name"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., Main Sanctuary"
              />
            </div>

            {/* Online Service Toggle */}
            <div className="flex items-center space-x-4 md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_online"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={formData.is_online}
                  onChange={(e) => setFormData({...formData, is_online: e.target.checked})}
                />
                <label htmlFor="is_online" className="ml-2 block text-sm text-gray-700">
                  This is an online service
                </label>
              </div>
            </div>

            {/* Online Link */}
            {formData.is_online && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Online Service Link
                </label>
                <input
                  type="url"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.online_link}
                  onChange={(e) => setFormData({...formData, online_link: e.target.value})}
                  placeholder="https://zoom.us/j/... or https://youtube.com/..."
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief description of the service..."
            />
          </div>

          {/* Worship Team Section */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Worship Team</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Worship Leader
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.worship_leader}
                  onChange={(e) => setFormData({...formData, worship_leader: e.target.value})}
                  placeholder="Name of worship leader"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Musicians (comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.musicians}
                  onChange={(e) => setFormData({...formData, musicians: e.target.value})}
                  placeholder="e.g., John on piano, Mary on vocals"
                />
              </div>
            </div>
          </div>

          {/* Songs Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Songs (one per line)
            </label>
            <textarea
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.songs}
              onChange={(e) => setFormData({...formData, songs: e.target.value})}
              placeholder="Amazing Grace&#10;How Great Thou Art&#10;10,000 Reasons"
            />
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <PhotoIcon className="h-4 w-4 inline mr-1" />
                Service Image
              </label>
              <div className="flex items-center space-x-2">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-12 w-12 object-cover rounded"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </div>

            {/* Bulletin Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Service Bulletin (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={onBulletinChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional information or instructions..."
            />
          </div>

          {/* Status Toggles */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.is_published}
                onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
                Publish immediately
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.is_featured}
                onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
              />
              <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                Feature this service
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
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
              {loading ? 'Saving...' : (service ? 'Update Service' : 'Schedule Service')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServiceProgramManager