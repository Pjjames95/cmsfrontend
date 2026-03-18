import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { publicAPI } from '../../lib/supabase'
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { CalendarIcon as CalendarIconSolid } from '@heroicons/react/24/solid'
import { format, parseISO, isToday, isFuture, isPast, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

const ServiceProgramPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [services, setServices] = useState([])
  const [featuredServices, setFeaturedServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list', 'calendar', 'grid'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const serviceTypes = [
    { value: 'sunday_service', label: 'Sunday Service', icon: '⛪', color: 'bg-purple-100 text-purple-800' },
    { value: 'wednesday_service', label: 'Wednesday Service', icon: '📖', color: 'bg-blue-100 text-blue-800' },
    { value: 'prayer_meeting', label: 'Prayer Meeting', icon: '🙏', color: 'bg-green-100 text-green-800' },
    { value: 'bible_study', label: 'Bible Study', icon: '📚', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'special_event', label: 'Special Event', icon: '🎉', color: 'bg-pink-100 text-pink-800' },
    { value: 'youth_service', label: 'Youth Service', icon: '🌟', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'children_service', label: "Children's Service", icon: '🧸', color: 'bg-orange-100 text-orange-800' },
    { value: 'other', label: 'Other', icon: '📅', color: 'bg-gray-100 text-gray-800' }
  ]

  // Check if we have a service ID in the URL hash
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash) {
      fetchServiceById(hash)
    } else {
      fetchServices()
    }
  }, [location])

  const fetchServices = async () => {
    try {
      setLoading(true)
      setSelectedService(null)
      
      // Fetch upcoming services
      const { data: servicesData, error: servicesError } = await publicAPI.getUpcomingServices(50)
      
      if (servicesError) throw servicesError

      // Fetch featured services
      const { data: featuredData } = await publicAPI.getFeaturedServices(3)

      setServices(servicesData || [])
      setFeaturedServices(featuredData || [])
    } catch (err) {
      console.error('Error fetching services:', err)
      setError('Failed to load services. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchServiceById = async (id) => {
    try {
      setLoading(true)
      const { data, error } = await publicAPI.getServiceById(id)
      
      if (error) throw error
      
      if (data) {
        setSelectedService(data)
      } else {
        setError('Service not found')
      }
    } catch (err) {
      console.error('Error fetching service:', err)
      setError('Failed to load the service. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.speaker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.series?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || service.service_type === selectedType
    
    return matchesSearch && matchesType
  })

  // Group services by date for calendar view
  const servicesByDate = filteredServices.reduce((acc, service) => {
    const date = service.service_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(service)
    return acc
  }, {})

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

  const getServiceTypeInfo = (typeValue) => {
    return serviceTypes.find(t => t.value === typeValue) || serviceTypes[7]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading services...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <CalendarIcon className="h-12 w-12 text-red-400 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Services</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => {
                setError(null)
                fetchServices()
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If viewing a single service
  if (selectedService) {
    const typeInfo = getServiceTypeInfo(selectedService.service_type)
    
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedService(null)
              navigate('/services')
            }}
            className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-indigo-600"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Services
          </button>

          {/* Service Detail */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Hero Image */}
            {selectedService.image_url && (
              <div className="h-64 overflow-hidden">
                <img
                  src={selectedService.image_url}
                  alt={selectedService.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8">
              {/* Type Badge */}
              <div className="flex items-center space-x-2 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
                  <span className="mr-1">{typeInfo.icon}</span>
                  {typeInfo.label}
                </span>
                {isToday(parseISO(selectedService.service_date)) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Today
                  </span>
                )}
              </div>

              {/* Title and Series */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedService.title}</h1>
              {selectedService.series && (
                <p className="text-lg text-indigo-600 mb-4">{selectedService.series}</p>
              )}

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium">{formatDate(selectedService.service_date)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium">
                    {formatTime(selectedService.start_time)}
                    {selectedService.end_time && ` - ${formatTime(selectedService.end_time)}`}
                  </span>
                </div>
              </div>

              {/* Speaker and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedService.speaker && (
                  <div className="flex items-center text-gray-600">
                    <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium">{selectedService.speaker}</span>
                  </div>
                )}
                {selectedService.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium">{selectedService.location}</span>
                  </div>
                )}
              </div>

              {/* Online Link */}
              {selectedService.is_online && selectedService.online_link && (
                <div className="mb-6">
                  <a
                    href={selectedService.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <VideoCameraIcon className="h-5 w-5 mr-2" />
                    Join Online Service
                  </a>
                </div>
              )}

              {/* Description */}
              {selectedService.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Service</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedService.description}</p>
                </div>
              )}

              {/* Worship Team */}
              {(selectedService.worship_leader || selectedService.musicians?.length > 0) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Worship Team</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedService.worship_leader && (
                      <div className="flex items-center text-gray-700 mb-2">
                        <MusicalNoteIcon className="h-5 w-5 mr-2 text-indigo-500" />
                        <span className="font-medium">Worship Leader:</span>
                        <span className="ml-2">{selectedService.worship_leader}</span>
                      </div>
                    )}
                    {selectedService.musicians?.length > 0 && (
                      <div className="flex items-center text-gray-700">
                        <MusicalNoteIcon className="h-5 w-5 mr-2 text-indigo-500" />
                        <span className="font-medium">Musicians:</span>
                        <span className="ml-2">{selectedService.musicians.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Songs */}
              {selectedService.songs?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Songs</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-1">
                      {selectedService.songs.map((song, index) => (
                        <li key={index} className="text-gray-700">{song}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Bulletin */}
              {selectedService.bulletin_url && (
                <div className="mt-6">
                  <a
                    href={selectedService.bulletin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Download Bulletin
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Service Programs</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join us for worship, prayer, and fellowship. View our upcoming services and events.
          </p>
        </div>

        {/* Featured Services */}
        {featuredServices.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredServices.map(service => {
                const typeInfo = getServiceTypeInfo(service.service_type)
                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => navigate(`/services#${service.id}`)}
                  >
                    {service.image_url ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={service.image_url}
                          alt={service.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <CalendarIcon className="h-16 w-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          <span className="mr-1">{typeInfo.icon}</span>
                          {typeInfo.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                        {service.title}
                      </h3>
                      {service.speaker && (
                        <p className="text-sm text-indigo-600 mb-2">{service.speaker}</p>
                      )}
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(service.service_date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatTime(service.start_time)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Filter by Service Type</h3>
                <button
                  onClick={() => setSelectedType('all')}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedType === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {serviceTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedType === type.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{type.icon}</span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex justify-end space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${
              viewMode === 'list' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="List view"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${
              viewMode === 'grid' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Grid view"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-md ${
              viewMode === 'calendar' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Calendar view"
          >
            <CalendarIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500">
          Showing {filteredServices.length} upcoming services
        </div>

        {/* Services Display */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No upcoming services</h3>
            <p className="mt-1 text-sm text-gray-500">
              Check back soon for our scheduled services and events.
            </p>
          </div>
        ) : (
          <>
            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredServices.map(service => {
                  const typeInfo = getServiceTypeInfo(service.service_type)
                  return (
                    <div
                      key={service.id}
                      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-all cursor-pointer border-l-4 border-indigo-500"
                      onClick={() => navigate(`/services#${service.id}`)}
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                <span className="mr-1">{typeInfo.icon}</span>
                                {typeInfo.label}
                              </span>
                              {isToday(parseISO(service.service_date)) && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Today
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">{service.title}</h3>
                            {service.speaker && (
                              <p className="text-sm text-indigo-600 mt-1">{service.speaker}</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                                {formatDate(service.service_date)}
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                                {formatTime(service.start_time)}
                              </div>
                              {service.location && (
                                <div className="flex items-center">
                                  <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                                  {service.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400 md:ml-4 mt-2 md:mt-0" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map(service => {
                  const typeInfo = getServiceTypeInfo(service.service_type)
                  return (
                    <div
                      key={service.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => navigate(`/services#${service.id}`)}
                    >
                      {service.image_url ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <CalendarIcon className="h-16 w-16 text-white opacity-50" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            <span className="mr-1">{typeInfo.icon}</span>
                            {typeInfo.label}
                          </span>
                          {isToday(parseISO(service.service_date)) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Today
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                          {service.title}
                        </h3>
                        {service.speaker && (
                          <p className="text-sm text-indigo-600 mb-2">{service.speaker}</p>
                        )}
                        <div className="space-y-1 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatDate(service.service_date)}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatTime(service.start_time)}
                          </div>
                          {service.location && (
                            <div className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {service.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 bg-indigo-600 text-white">
                  <h3 className="text-lg font-semibold">Upcoming Services Calendar</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {Object.keys(servicesByDate).sort().map(date => (
                    <div key={date} className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{formatDate(date)}</h4>
                      <div className="space-y-3">
                        {servicesByDate[date].map(service => {
                          const typeInfo = getServiceTypeInfo(service.service_type)
                          return (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                              onClick={() => navigate(`/services#${service.id}`)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                    <span className="mr-1">{typeInfo.icon}</span>
                                    {typeInfo.label}
                                  </span>
                                </div>
                                <h5 className="font-medium text-gray-900">{service.title}</h5>
                                {service.speaker && (
                                  <p className="text-xs text-indigo-600">{service.speaker}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatTime(service.start_time)}
                                </div>
                                {service.location && (
                                  <div className="text-xs text-gray-500">{service.location}</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ServiceProgramPage