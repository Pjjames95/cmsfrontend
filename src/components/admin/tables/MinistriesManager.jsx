import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  BuildingOfficeIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const MinistriesManager = () => {
  const { adminUser } = useAdminAuth()
  const [ministries, setMinistries] = useState([])
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMinistry, setEditingMinistry] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    fetchMinistries()
    fetchPotentialLeaders()
  }, [])

  const fetchMinistries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ministries')
        .select(`
          *,
          leader:leader_id (
            email,
            full_name
          )
        `)
        .order('name', { ascending: true })
      
      if (error) throw error

      // Format the data
      const formattedData = data.map(ministry => ({
        ...ministry,
        leader_name: ministry.leader?.full_name || ministry.leader_name || 'Not assigned',
        leader_email: ministry.leader?.email || ''
      }))
      
      setMinistries(formattedData)
    } catch (error) {
      console.error('Error fetching ministries:', error)
      toast.error('Failed to load ministries')
    } finally {
      setLoading(false)
    }
  }

  const fetchPotentialLeaders = async () => {
    try {
      // Get users with leadership potential (have roles or can be leaders)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name', { ascending: true })
      
      if (error) throw error
      setLeaders(profiles || [])
    } catch (error) {
      console.error('Error fetching leaders:', error)
    }
  }

  const handleAdd = () => {
    setEditingMinistry(null)
    setImagePreview(null)
    setImageFile(null)
    setShowModal(true)
  }

  const handleEdit = (ministry) => {
    setEditingMinistry(ministry)
    setImagePreview(ministry.image_url)
    setImageFile(null)
    setShowModal(true)
  }

  const handleDelete = async (ministry) => {
    if (!confirm(`Are you sure you want to delete the ministry "${ministry.name}"?`)) return

    try {
      const { error } = await supabase
        .from('ministries')
        .delete()
        .eq('id', ministry.id)
      
      if (error) throw error
      
      toast.success('Ministry deleted successfully')
      fetchMinistries()
    } catch (error) {
      console.error('Error deleting ministry:', error)
      toast.error('Failed to delete ministry')
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `ministry-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSubmit = async (formData) => {
    try {
      let imageUrl = editingMinistry?.image_url || null

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const ministryData = {
        name: formData.name,
        description: formData.description,
        leader_id: formData.leader_id || null,
        leader_name: leaders.find(l => l.id === formData.leader_id)?.full_name || formData.leader_name,
        meeting_time: formData.meeting_time,
        meeting_location: formData.meeting_location,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        image_url: imageUrl,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      }

      if (editingMinistry) {
        // Update existing ministry
        const { error } = await supabase
          .from('ministries')
          .update(ministryData)
          .eq('id', editingMinistry.id)
        
        if (error) throw error
        toast.success('Ministry updated successfully')
      } else {
        // Create new ministry
        const { error } = await supabase
          .from('ministries')
          .insert([{
            ...ministryData,
            created_by: adminUser?.id,
            created_at: new Date().toISOString()
          }])
        
        if (error) throw error
        toast.success('Ministry created successfully')
      }
      
      setShowModal(false)
      fetchMinistries()
    } catch (error) {
      console.error('Error saving ministry:', error)
      toast.error('Failed to save ministry: ' + (error.message || 'Unknown error'))
    }
  }

  const toggleActive = async (ministry) => {
    try {
      const { error } = await supabase
        .from('ministries')
        .update({ 
          is_active: !ministry.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', ministry.id)
      
      if (error) throw error
      
      toast.success(`Ministry ${ministry.is_active ? 'deactivated' : 'activated'} successfully`)
      fetchMinistries()
    } catch (error) {
      console.error('Error toggling ministry status:', error)
      toast.error('Failed to update ministry status')
    }
  }

  // Filter ministries based on search
  const filteredMinistries = ministries.filter(ministry =>
    ministry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ministry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ministry.leader_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-2xl font-semibold text-gray-900">Ministries Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all church ministries, their leaders, and meeting details.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Ministry
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <input
          type="text"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Search ministries by name, description, or leader..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Ministries Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMinistries.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No ministries</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new ministry.
            </p>
          </div>
        ) : (
          filteredMinistries.map((ministry) => (
            <div
              key={ministry.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="h-48 bg-gray-200 relative">
                {ministry.image_url ? (
                  <img
                    src={ministry.image_url}
                    alt={ministry.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                    <BuildingOfficeIcon className="h-16 w-16 text-indigo-400" />
                  </div>
                )}
                {/* Status Badge */}
                <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full ${
                  ministry.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {ministry.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900">{ministry.name}</h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{ministry.description}</p>
                
                {/* Details */}
                <div className="mt-4 space-y-2">
                  {ministry.leader_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {ministry.leader_name}
                    </div>
                  )}
                  {ministry.meeting_time && (
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {ministry.meeting_time}
                    </div>
                  )}
                  {ministry.meeting_location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {ministry.meeting_location}
                    </div>
                  )}
                  {ministry.contact_email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`mailto:${ministry.contact_email}`} className="hover:text-indigo-600">
                        {ministry.contact_email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => toggleActive(ministry)}
                    className={`text-xs font-semibold ${
                      ministry.is_active 
                        ? 'text-yellow-600 hover:text-yellow-800' 
                        : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {ministry.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <div>
                    <button
                      onClick={() => handleEdit(ministry)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Edit ministry"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ministry)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete ministry"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ministry Modal */}
      {showModal && (
        <MinistryModal
          ministry={editingMinistry}
          leaders={leaders}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// Ministry Modal Component
const MinistryModal = ({ ministry, leaders, imagePreview, onImageChange, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: ministry?.name || '',
    description: ministry?.description || '',
    leader_id: ministry?.leader_id || '',
    leader_name: ministry?.leader_name || '',
    meeting_time: ministry?.meeting_time || '',
    meeting_location: ministry?.meeting_location || '',
    contact_email: ministry?.contact_email || '',
    contact_phone: ministry?.contact_phone || '',
    is_active: ministry?.is_active ?? true
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
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            {ministry ? 'Edit Ministry' : 'Add New Ministry'}
          </h3>
          <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Two columns layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ministry Name *
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              {/* Leader Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ministry Leader
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.leader_id}
                  onChange={(e) => {
                    const leader = leaders.find(l => l.id === e.target.value)
                    setFormData({
                      ...formData,
                      leader_id: e.target.value,
                      leader_name: leader?.full_name || ''
                    })
                  }}
                >
                  <option value="">Select a leader</option>
                  {leaders.map(leader => (
                    <option key={leader.id} value={leader.id}>
                      {leader.full_name || leader.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Meeting Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Time
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.meeting_time}
                  onChange={(e) => setFormData({...formData, meeting_time: e.target.value})}
                  placeholder="e.g., Sundays 10:00 AM"
                />
              </div>

              {/* Meeting Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Location
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.meeting_location}
                  onChange={(e) => setFormData({...formData, meeting_location: e.target.value})}
                  placeholder="e.g., Main Sanctuary"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ministry Image
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('image-upload').value = ''
                          onImageChange({ target: { files: [] } })
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={onImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active (visible on public site)
                </label>
              </div>
            </div>
          </div>

          {/* Description - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the ministry's purpose and activities..."
            />
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
              {loading ? 'Saving...' : (ministry ? 'Update Ministry' : 'Create Ministry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MinistriesManager