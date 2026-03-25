import React, { useState, useEffect } from 'react'
import { supabase, sanitizedDb } from '../../../lib/supabaseClient'
import { publicAPI } from '../../../lib/publicAPI'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  FolderIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  PhotoIcon,
  EyeIcon,
  StarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

const ProjectsManager = () => {
  const { adminUser } = useAdminAuth()
  const [projects, setProjects] = useState([])
  const [projectManagers, setProjectManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // File upload states
  const [imageFile, setImageFile] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [imagePreview, setImagePreview] = useState(null)
  const [galleryPreviews, setGalleryPreviews] = useState([])

  const statusOptions = [
    { value: 'planned', label: 'Planned', icon: '📋', color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-50' },
    { value: 'in_progress', label: 'In Progress', icon: '🔄', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50' },
    { value: 'completed', label: 'Completed', icon: '✅', color: 'bg-green-100 text-green-800', bgColor: 'bg-green-50' },
    { value: 'on_hold', label: 'On Hold', icon: '⏸️', color: 'bg-orange-100 text-orange-800', bgColor: 'bg-orange-50' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌', color: 'bg-red-100 text-red-800', bgColor: 'bg-red-50' }
  ]

  useEffect(() => {
    fetchProjects()
    fetchProjectManagers()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Format the data
      const formattedData = data.map(project => ({
        ...project,
        status_info: statusOptions.find(s => s.value === project.status) || statusOptions[0],
        progress_percentage: project.progress || 0,
        funding_progress: project.budget ? Math.round((project.raised_amount / project.budget) * 100) : 0
      }))
      
      setProjects(formattedData)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectManagers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true })
      
      if (error) throw error
      setProjectManagers(profiles || [])
    } catch (error) {
      console.error('Error fetching project managers:', error)
    }
  }

  const handleAdd = () => {
    setEditingProject(null)
    setImagePreview(null)
    setGalleryPreviews([])
    setImageFile(null)
    setGalleryFiles([])
    setShowModal(true)
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setImagePreview(project.image_url)
    setGalleryPreviews(project.gallery_images || [])
    setImageFile(null)
    setGalleryFiles([])
    setShowModal(true)
  }

  const handleDelete = async (project) => {
    if (!confirm(`Are you sure you want to delete the project "${project.name}"?`)) return

    try {
      // Delete associated images
      const filesToDelete = []
      if (project.image_url) filesToDelete.push(project.image_url.split('/').pop())
      if (project.gallery_images?.length > 0) {
        project.gallery_images.forEach(url => {
          filesToDelete.push(url.split('/').pop())
        })
      }

      if (filesToDelete.length > 0) {
        await supabase.storage
          .from('project-images')
          .remove(filesToDelete)
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
      
      if (error) throw error
      
      toast.success('Project deleted successfully')
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setGalleryFiles(prev => [...prev, ...files])

    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setGalleryPreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeGalleryImage = (index) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index))
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImage = async (file, folder) => {
    try {
        if (!file) return null

        console.log('Uploading file:', file.name, 'type:', file.type, 'size:', file.size) // Debug log

        const fileExt = file.name.split('.').pop()
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        console.log('Upload path:', fileName) // Debug log

        const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file)

        if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
        }

        console.log('Upload successful:', uploadData) // Debug log

        const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName)

        console.log('Public URL:', publicUrl) // Debug log

        return publicUrl
    } catch (error) {
        console.error('Error uploading image:', error)
        toast.error(`Failed to upload image: ${error.message}`)
        throw error
    }
}

  const handleSubmit = async (formData) => {
    try {
        let imageUrl = editingProject?.image_url || null
        let galleryUrls = editingProject?.gallery_images || []

        console.log('Starting submit with existing images:', { imageUrl, galleryUrls }) // Debug log

        // Upload main image if selected
        if (imageFile) {
        console.log('Uploading main image...') // Debug log
        if (editingProject?.image_url) {
            const oldPath = editingProject.image_url.split('/').pop()
            await supabase.storage
            .from('project-images')
            .remove([oldPath])
            .catch(err => console.log('Error deleting old image:', err))
        }
        imageUrl = await uploadImage(imageFile, 'main')
        console.log('New main image URL:', imageUrl) // Debug log
        }

    // Upload gallery images if selected
        if (galleryFiles.length > 0) {
        console.log('Uploading gallery images:', galleryFiles.length) // Debug log
        const newGalleryUrls = await Promise.all(
            galleryFiles.map(async (file, index) => {
            const url = await uploadImage(file, 'gallery')
            console.log(`Gallery image ${index + 1} URL:`, url) // Debug log
            return url
            })
        )
        galleryUrls = [...galleryUrls, ...newGalleryUrls]
        console.log('All gallery URLs:', galleryUrls) // Debug log
        }

      // Handle milestones
      const milestones = formData.milestones ? JSON.parse(formData.milestones) : []

      const projectData = {
        name: formData.name,
        description: formData.description,
        goal: formData.goal,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
        progress: parseInt(formData.progress) || 0,
        budget: parseFloat(formData.budget) || null,
        raised_amount: parseFloat(formData.raised_amount) || 0,
        project_manager: formData.project_manager || null,
        project_manager_id: formData.project_manager_id || null,
        team_members: formData.team_members ? formData.team_members.split(',').map(m => m.trim()) : [],
        location: formData.location || null,
        image_url: imageUrl,
        gallery_images: galleryUrls,
        milestones: milestones,
        is_public: formData.is_public || false,
        is_featured: formData.is_featured || false,
        updated_at: new Date().toISOString()
      }

      if (editingProject) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id)
        
        if (error) throw error
        toast.success('Project updated successfully')
      } else {
        // Create new project
        const { error } = await supabase
          .from('projects')
          .insert([{
            ...projectData,
            created_by: adminUser?.id,
            created_at: new Date().toISOString(),
            view_count: 0
          }])
        
        if (error) throw error
        toast.success('Project created successfully')
      }
      
      setShowModal(false)
      fetchProjects()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error('Failed to save project: ' + (error.message || 'Unknown error'))
    }
  }

  const togglePublic = async (project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          is_public: !project.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
      
      if (error) throw error
      
      toast.success(`Project ${project.is_public ? 'hidden from' : 'visible to'} public`)
      fetchProjects()
    } catch (error) {
      console.error('Error toggling public status:', error)
      toast.error('Failed to update project status')
    }
  }

  const toggleFeatured = async (project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          is_featured: !project.is_featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
      
      if (error) throw error
      
      toast.success(`Project ${project.is_featured ? 'removed from' : 'added to'} featured`)
      fetchProjects()
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast.error('Failed to update featured status')
    }
  }

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.goal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return format(parseISO(dateString), 'MMM d, yyyy')
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'KSH 0'
    return `KSH ${amount.toLocaleString()}`
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
          <h1 className="text-2xl font-semibold text-gray-900">Projects Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage church projects, track progress, and showcase initiatives.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Project
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 flex items-center space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search projects..."
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
          {statusFilter !== 'all' && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Filter by Status</h3>
            <button
              onClick={() => setStatusFilter('all')}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {statusOptions.map(status => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === status.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{status.icon}</span>
                {status.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new project.
            </p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Project
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
              {/* Project Image */}
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                {project.image_url ? (
                    <img
                    src={project.image_url}
                    alt={project.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        console.error('Image failed to load:', project.image_url)
                        e.target.onerror = null
                        e.target.src = '' // Clear broken image
                        e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600"><svg class="h-16 w-16 text-white opacity-50" ... /></div>'
                    }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
                    <FolderIcon className="h-16 w-16 text-white opacity-50" />
                    </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  {project.is_featured && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <StarIconSolid className="h-3 w-3 mr-1" />
                      Featured
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${project.status_info.color}`}>
                    <span className="mr-1">{project.status_info.icon}</span>
                    {project.status_info.label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">{project.name}</h3>
                
                {/* Location */}
                {project.location && (
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {project.location}
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {project.description}
                </p>

                {/* Progress Bar */}
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

                {/* Funding Progress */}
                {project.budget > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Funding</span>
                      <span>{project.funding_progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${project.funding_progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{formatCurrency(project.raised_amount)}</span>
                      <span>of {formatCurrency(project.budget)}</span>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  {project.start_date && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Start: {formatDate(project.start_date)}
                    </div>
                  )}
                  {project.end_date && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      End: {formatDate(project.end_date)}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
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

                {/* Actions */}
                <div className="flex justify-between items-center border-t pt-3">
                  <button
                    onClick={() => togglePublic(project)}
                    className={`text-xs font-semibold ${
                      project.is_public 
                        ? 'text-green-600 hover:text-green-800' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {project.is_public ? 'Public' : 'Hidden'}
                  </button>
                  <div>
                    <button
                      onClick={() => toggleFeatured(project)}
                      className={`mr-3 ${
                        project.is_featured 
                          ? 'text-yellow-600 hover:text-yellow-800' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={project.is_featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <StarIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(project)}
                      className="text-indigo-600 hover:text-indigo-800 mr-3"
                      title="Edit project"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete project"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Project Modal */}
      {showModal && (
        <ProjectModal
          project={editingProject}
          projectManagers={projectManagers}
          statusOptions={statusOptions}
          imagePreview={imagePreview}
          galleryPreviews={galleryPreviews}
          onImageChange={handleImageChange}
          onGalleryChange={handleGalleryChange}
          onRemoveGalleryImage={removeGalleryImage}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// Project Modal Component
const ProjectModal = ({ 
  project, projectManagers, statusOptions, 
  imagePreview, galleryPreviews,
  onImageChange, onGalleryChange, onRemoveGalleryImage,
  onClose, onSubmit 
}) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    goal: project?.goal || '',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    status: project?.status || 'planned',
    progress: project?.progress || 0,
    budget: project?.budget || '',
    raised_amount: project?.raised_amount || 0,
    project_manager: project?.project_manager || '',
    project_manager_id: project?.project_manager_id || '',
    team_members: project?.team_members?.join(', ') || '',
    location: project?.location || '',
    milestones: JSON.stringify(project?.milestones || []),
    is_public: project?.is_public ?? true,
    is_featured: project?.is_featured ?? false
  })
  const [loading, setLoading] = useState(false)
  const [showMilestones, setShowMilestones] = useState(false)

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
            {project ? 'Edit Project' : 'Add New Project'}
          </h3>
          <FolderIcon className="h-6 w-6 text-indigo-600" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Basic Info - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                required
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.icon} {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.progress}
                onChange={(e) => setFormData({...formData, progress: e.target.value})}
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget (KSH)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
              />
            </div>

            {/* Raised Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raised Amount (KSH)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.raised_amount}
                onChange={(e) => setFormData({...formData, raised_amount: e.target.value})}
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
                placeholder="e.g., Main Campus"
              />
            </div>

            {/* Project Manager Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Manager
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.project_manager_id}
                onChange={(e) => {
                  const manager = projectManagers.find(m => m.id === e.target.value)
                  setFormData({
                    ...formData,
                    project_manager_id: e.target.value,
                    project_manager: manager?.full_name || ''
                  })
                }}
              >
                <option value="">Select a manager</option>
                {projectManagers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.full_name || manager.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Or Manual Manager Entry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or Enter Manager Name
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.project_manager}
                onChange={(e) => setFormData({...formData, project_manager: e.target.value})}
                placeholder="Enter manager name"
              />
            </div>

            {/* Team Members */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Members (comma-separated)
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.team_members}
                onChange={(e) => setFormData({...formData, team_members: e.target.value})}
                placeholder="e.g., John Doe, Jane Smith, Mike Johnson"
              />
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Goal
            </label>
            <textarea
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.goal}
              onChange={(e) => setFormData({...formData, goal: e.target.value})}
              placeholder="What is the main goal of this project?"
            />
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
              placeholder="Detailed description of the project..."
            />
          </div>

          {/* Image Uploads */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Project Images</h4>
            
            {/* Main Image */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <PhotoIcon className="h-4 w-4 inline mr-1" />
                Main Project Image
              </label>
              <div className="flex items-center space-x-2">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded"
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

            {/* Gallery Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gallery Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onGalleryChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-2"
              />
              {galleryPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {galleryPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Gallery ${index + 1}`}
                        className="h-20 w-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveGalleryImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Milestones Toggle */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowMilestones(!showMilestones)}
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <ChartBarIcon className="h-4 w-4 mr-1" />
              {showMilestones ? 'Hide Milestones' : 'Add Milestones (JSON format)'}
            </button>

            {showMilestones && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Milestones (JSON array)
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                  value={formData.milestones}
                  onChange={(e) => setFormData({...formData, milestones: e.target.value})}
                  placeholder='[{"title": "Phase 1", "completed": true}, {"title": "Phase 2", "completed": false}]'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter milestones as a JSON array with title and completed status
                </p>
              </div>
            )}
          </div>

          {/* Status Toggles */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.is_public}
                onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                Public (visible to everyone)
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
                Feature this project
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
              {loading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectsManager