import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { publicAPI } from '../../lib/supabase'
import { 
  FolderIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  PhotoIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { format, parseISO } from 'date-fns'

const ProjectsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [projects, setProjects] = useState([])
  const [featuredProjects, setFeaturedProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const statusOptions = [
    { value: 'planned', label: 'Planned', icon: '📋', color: 'bg-blue-100 text-blue-800', borderColor: 'border-blue-500' },
    { value: 'in_progress', label: 'In Progress', icon: '🔄', color: 'bg-yellow-100 text-yellow-800', borderColor: 'border-yellow-500' },
    { value: 'completed', label: 'Completed', icon: '✅', color: 'bg-green-100 text-green-800', borderColor: 'border-green-500' },
    { value: 'on_hold', label: 'On Hold', icon: '⏸️', color: 'bg-orange-100 text-orange-800', borderColor: 'border-orange-500' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌', color: 'bg-red-100 text-red-800', borderColor: 'border-red-500' }
  ]

  // Check if we have a project ID in the URL hash
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash) {
      fetchProjectById(hash)
    } else {
      fetchProjects()
    }
  }, [location])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setSelectedProject(null)
      
      // Fetch all public projects
      const { data: projectsData, error: projectsError } = await publicAPI.getProjects()
      
      if (projectsError) throw projectsError

      // Fetch featured projects
      const { data: featuredData } = await publicAPI.getFeaturedProjects(3)

      setProjects(projectsData || [])
      setFeaturedProjects(featuredData || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('Failed to load projects. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectById = async (id) => {
    try {
      setLoading(true)
      const { data, error } = await publicAPI.getProjectById(id)
      
      if (error) throw error
      
      if (data) {
        setSelectedProject(data)
        // Increment view count
        await publicAPI.incrementProjectViewCount?.(id)
      } else {
        setError('Project not found')
      }
    } catch (err) {
      console.error('Error fetching project:', err)
      setError('Failed to load the project. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (statusValue) => {
    return statusOptions.find(s => s.value === statusValue) || statusOptions[0]
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return format(parseISO(dateString), 'MMM d, yyyy')
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'KSH 0'
    return `KSH ${amount.toLocaleString()}`
  }

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.goal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
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
            <FolderIcon className="h-12 w-12 text-red-400 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Projects</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => {
                setError(null)
                fetchProjects()
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

  // If viewing a single project
  if (selectedProject) {
    const statusInfo = getStatusInfo(selectedProject.status)
    const fundingProgress = selectedProject.budget 
      ? Math.round((selectedProject.raised_amount / selectedProject.budget) * 100) 
      : 0

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedProject(null)
              navigate('/projects')
            }}
            className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-indigo-600"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Projects
          </button>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Hero Image */}
            {selectedProject.image_url && (
              <div className="h-96 overflow-hidden">
                <img
                  src={selectedProject.image_url}
                  alt={selectedProject.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8">
              {/* Title and Status */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{selectedProject.name}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  <span className="mr-1">{statusInfo.icon}</span>
                  {statusInfo.label}
                </span>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {selectedProject.budget > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">Budget</dt>
                    <dd className="mt-1 text-xl font-semibold text-gray-900">
                      {formatCurrency(selectedProject.budget)}
                    </dd>
                  </div>
                )}
                {selectedProject.raised_amount > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">Raised</dt>
                    <dd className="mt-1 text-xl font-semibold text-green-600">
                      {formatCurrency(selectedProject.raised_amount)}
                    </dd>
                  </div>
                )}
                {selectedProject.progress > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">Progress</dt>
                    <dd className="mt-1 text-xl font-semibold text-indigo-600">
                      {selectedProject.progress}%
                    </dd>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Views</dt>
                  <dd className="mt-1 text-xl font-semibold text-gray-900">
                    {selectedProject.view_count || 0}
                  </dd>
                </div>
              </div>

              {/* Progress Bars */}
              {selectedProject.progress > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>Overall Progress</span>
                    <span>{selectedProject.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-indigo-600 rounded-full h-3 transition-all duration-300"
                      style={{ width: `${selectedProject.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedProject.budget > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>Funding Progress</span>
                    <span>{fundingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 rounded-full h-3 transition-all duration-300"
                      style={{ width: `${fundingProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                    <span>Raised: {formatCurrency(selectedProject.raised_amount)}</span>
                    <span>Goal: {formatCurrency(selectedProject.budget)}</span>
                  </div>
                </div>
              )}

              {/* Project Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Location */}
                  {selectedProject.location && (
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Location</h3>
                        <p className="text-gray-900">{selectedProject.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
                      <p className="text-gray-900">
                        {selectedProject.start_date ? formatDate(selectedProject.start_date) : 'Start TBD'}
                        {selectedProject.end_date && ` - ${formatDate(selectedProject.end_date)}`}
                      </p>
                    </div>
                  </div>

                  {/* Project Manager */}
                  {selectedProject.project_manager && (
                    <div className="flex items-start">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Project Manager</h3>
                        <p className="text-gray-900">{selectedProject.project_manager}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Team Members */}
                  {selectedProject.team_members?.length > 0 && (
                    <div className="flex items-start">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Team Members</h3>
                        <p className="text-gray-900">{selectedProject.team_members.join(', ')}</p>
                      </div>
                    </div>
                  )}

                  {/* View Count */}
                  <div className="flex items-start">
                    <EyeIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Views</h3>
                      <p className="text-gray-900">{selectedProject.view_count || 0} people have viewed this project</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal */}
              {selectedProject.goal && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Goal</h3>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{selectedProject.goal}</p>
                </div>
              )}

              {/* Description */}
              {selectedProject.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedProject.description}</p>
                </div>
              )}

              {/* Gallery */}
              {selectedProject.gallery_images?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProject.gallery_images.map((image, index) => (
                      <div
                        key={index}
                        className="relative h-32 cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {selectedProject.milestones?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h3>
                  <div className="space-y-3">
                    {selectedProject.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center">
                        {milestone.completed ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                        ) : (
                          <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                        )}
                        <span className={milestone.completed ? 'text-gray-900' : 'text-gray-500'}>
                          {milestone.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image Modal */}
          {selectedImage && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-4xl max-h-full">
                <img
                  src={selectedImage}
                  alt="Gallery"
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Church Projects</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the initiatives and developments happening in our church community.
            Track our progress and see how you can get involved.
          </p>
        </div>

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProjects.map(project => {
                const statusInfo = getStatusInfo(project.status)
                return (
                  <div
                    key={project.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                    onClick={() => navigate(`/projects#${project.id}`)}
                  >
                    {project.image_url ? (
                        <div className="h-48 overflow-hidden">
                            <img
                            src={project.image_url}
                            alt={project.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                                console.error('Image failed to load:', project.image_url)
                                e.target.onerror = null
                                e.target.style.display = 'none'
                                e.target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
                                    <svg class="h-16 w-16 text-white opacity-50" ... />
                                </div>
                                `
                            }}
                            />
                        </div>
                        ) : (
                        <div className="h-48 bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <FolderIcon className="h-16 w-16 text-white opacity-50" />
                        </div>
                        )}

                        {/* For detail view hero image */}
                        {selectedProject.image_url ? (
                        <div className="h-96 overflow-hidden">
                            <img
                            src={selectedProject.image_url}
                            alt={selectedProject.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                console.error('Hero image failed to load:', selectedProject.image_url)
                                e.target.onerror = null
                                e.target.style.display = 'none'
                                // You might want to show a fallback here
                            }}
                            />
                        </div>
                        ) : (
                        <div className="h-96 bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <FolderIcon className="h-24 w-24 text-white opacity-50" />
                        </div>
                        )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {project.name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <span className="mr-1">{statusInfo.icon}</span>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {project.description}
                      </p>
                      <div className="space-y-2">
                        {project.progress > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-indigo-600 rounded-full h-1.5"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {project.budget > 0 && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Budget</span>
                            <span>{formatCurrency(project.budget)}</span>
                          </div>
                        )}
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
                placeholder="Search projects by name, description, or location..."
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
              {selectedStatus !== 'all' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Filter by Status</h3>
                <button
                  onClick={() => setSelectedStatus('all')}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Projects
                </button>
                {statusOptions.map(status => (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedStatus === status.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{status.icon}</span>
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
            {(searchTerm || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedStatus('all')
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map(project => {
              const statusInfo = getStatusInfo(project.status)
              const fundingProgress = project.budget 
                ? Math.round((project.raised_amount / project.budget) * 100) 
                : 0

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                  onClick={() => navigate(`/projects#${project.id}`)}
                >
                  {/* Project Image */}
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt={project.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
                        <FolderIcon className="h-16 w-16 text-white opacity-50" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <span className="mr-1">{statusInfo.icon}</span>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                      {project.name}
                    </h3>

                    {/* Location */}
                    {project.location && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {project.location}
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Progress Bar */}
                    {project.progress > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 rounded-full h-2 transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Funding Progress */}
                    {project.budget > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Funding</span>
                          <span>{fundingProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 rounded-full h-2 transition-all duration-300"
                            style={{ width: `${fundingProgress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                          <span>{formatCurrency(project.raised_amount)}</span>
                          <span>of {formatCurrency(project.budget)}</span>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {project.view_count || 0} views
                      </div>
                      {project.gallery_images?.length > 0 && (
                        <div className="flex items-center">
                          <PhotoIcon className="h-3 w-3 mr-1" />
                          {project.gallery_images.length} photos
                        </div>
                      )}
                    </div>

                    {/* View Details Link */}
                    <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium">
                      View Project Details
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats Summary */}
        {projects.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-4">
              <div className="text-center">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                <dd className="mt-1 text-3xl font-semibold text-indigo-600">{projects.length}</dd>
              </div>
              <div className="text-center">
                <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                  {projects.filter(p => p.status === 'in_progress').length}
                </dd>
              </div>
              <div className="text-center">
                <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  {projects.filter(p => p.status === 'completed').length}
                </dd>
              </div>
              <div className="text-center">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Budget</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {formatCurrency(projects.reduce((sum, p) => sum + (p.budget || 0), 0))}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectsPage