import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  MusicalNoteIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  PhotoIcon,
  TagIcon,
  StarIcon,
  ClockIcon,
  BookOpenIcon,
  LinkIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

const SermonsManager = () => {
  const { adminUser } = useAdminAuth()
  const [sermons, setSermons] = useState([])
  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSermon, setEditingSermon] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [seriesFilter, setSeriesFilter] = useState('all')
  const [series, setSeries] = useState([])

  // File upload states
  const [audioFile, setAudioFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [notesFile, setNotesFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    fetchSermons()
    fetchSpeakers()
  }, [])

  const fetchSermons = async () => {
    try {
        setLoading(true)
        const { data, error } = await supabase
        .from('sermons')
        .select('*')
        .order('date_preached', { ascending: false })
        
        if (error) throw error

        // Extract unique series
        const uniqueSeries = [...new Set(data.map(s => s.series).filter(Boolean))]
        setSeries(uniqueSeries)

        // Just use the speaker field directly
        const formattedData = data.map(sermon => ({
        ...sermon,
        speaker_name: sermon.speaker || 'Unknown'
        }))
        
        setSermons(formattedData)
    } catch (error) {
        console.error('Error fetching sermons:', error)
        toast.error('Failed to load sermons')
    } finally {
        setLoading(false)
    }
    }

  const fetchSpeakers = async () => {
    try {
      // Get potential speakers from profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true })
      
      if (error) throw error
      setSpeakers(profiles || [])
    } catch (error) {
      console.error('Error fetching speakers:', error)
    }
  }

  const handleAdd = () => {
    setEditingSermon(null)
    setImagePreview(null)
    setAudioFile(null)
    setImageFile(null)
    setNotesFile(null)
    setShowModal(true)
  }

  const handleEdit = (sermon) => {
    setEditingSermon(sermon)
    setImagePreview(sermon.image_url)
    setAudioFile(null)
    setImageFile(null)
    setNotesFile(null)
    setShowModal(true)
  }

  const handleDelete = async (sermon) => {
    if (!confirm(`Are you sure you want to delete the sermon "${sermon.title}"?`)) return

    try {
      // Delete associated files
      const filesToDelete = []
      if (sermon.audio_url) filesToDelete.push(sermon.audio_url.split('/').pop())
      if (sermon.image_url) filesToDelete.push(sermon.image_url.split('/').pop())
      if (sermon.notes_url) filesToDelete.push(sermon.notes_url.split('/').pop())

      if (filesToDelete.length > 0) {
        await supabase.storage
          .from('sermon-audio')
          .remove(filesToDelete)
      }

      const { error } = await supabase
        .from('sermons')
        .delete()
        .eq('id', sermon.id)
      
      if (error) throw error
      
      toast.success('Sermon deleted successfully')
      fetchSermons()
    } catch (error) {
      console.error('Error deleting sermon:', error)
      toast.error('Failed to delete sermon')
    }
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    switch(type) {
      case 'audio':
        setAudioFile(file)
        break
      case 'image':
        setImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result)
        }
        reader.readAsDataURL(file)
        break
      case 'notes':
        setNotesFile(file)
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
      let audioUrl = editingSermon?.audio_url || null
      let imageUrl = editingSermon?.image_url || null
      let notesUrl = editingSermon?.notes_url || null

      // Upload new files if selected
      if (audioFile) {
        audioUrl = await uploadFile(audioFile, 'sermon-audio', 'audio')
      }
      
      if (imageFile) {
        if (editingSermon?.image_url) {
          const oldImagePath = editingSermon.image_url.split('/').pop()
          await supabase.storage
            .from('sermon-images')
            .remove([oldImagePath])
        }
        imageUrl = await uploadFile(imageFile, 'sermon-images', 'images')
      }
      
      if (notesFile) {
        notesUrl = await uploadFile(notesFile, 'sermon-notes', 'notes')
      }

      const sermonData = {
        title: formData.title,
        speaker: formData.speaker, // Just use the text input
        // speaker_id: formData.speaker_id || null, // Remove this line
        series: formData.series,
        description: formData.description,
        bible_passage: formData.bible_passage,
        date_preached: formData.date_preached,
        audio_url: audioUrl,
        video_url: formData.video_url,
        image_url: imageUrl,
        notes_url: notesUrl,
        duration: parseInt(formData.duration) || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString()
        }

      if (editingSermon) {
        // Update existing sermon
        const { error } = await supabase
          .from('sermons')
          .update(sermonData)
          .eq('id', editingSermon.id)
        
        if (error) throw error
        toast.success('Sermon updated successfully')
      } else {
        // Create new sermon
        const { error } = await supabase
          .from('sermons')
          .insert([{
            ...sermonData,
            created_by: adminUser?.id,
            created_at: new Date().toISOString(),
            view_count: 0,
            download_count: 0
          }])
        
        if (error) throw error
        toast.success('Sermon created successfully')
      }
      
      setShowModal(false)
      fetchSermons()
    } catch (error) {
      console.error('Error saving sermon:', error)
      toast.error('Failed to save sermon: ' + (error.message || 'Unknown error'))
    }
  }

  const togglePublish = async (sermon) => {
    try {
      const { error } = await supabase
        .from('sermons')
        .update({ 
          is_published: !sermon.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', sermon.id)
      
      if (error) throw error
      
      toast.success(`Sermon ${sermon.is_published ? 'unpublished' : 'published'} successfully`)
      fetchSermons()
    } catch (error) {
      console.error('Error toggling publish status:', error)
      toast.error('Failed to update sermon status')
    }
  }

  const toggleFeatured = async (sermon) => {
    try {
      const { error } = await supabase
        .from('sermons')
        .update({ 
          is_featured: !sermon.is_featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', sermon.id)
      
      if (error) throw error
      
      toast.success(`Sermon ${sermon.is_featured ? 'removed from' : 'added to'} featured`)
      fetchSermons()
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast.error('Failed to update featured status')
    }
  }

  // Filter sermons based on search and filters
  const filteredSermons = sermons.filter(sermon => {
    const matchesSearch = 
      sermon.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sermon.speaker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sermon.bible_passage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sermon.series?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && sermon.is_published) ||
      (statusFilter === 'draft' && !sermon.is_published)
    
    const matchesSeries = seriesFilter === 'all' || sermon.series === seriesFilter
    
    return matchesSearch && matchesStatus && matchesSeries
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '—'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
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
          <h1 className="text-2xl font-semibold text-gray-900">Sermons Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Upload and manage sermons, including audio files, video links, and sermon notes.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Sermon
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <input
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Search sermons by title, speaker, or passage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={seriesFilter}
            onChange={(e) => setSeriesFilter(e.target.value)}
          >
            <option value="all">All Series</option>
            {series.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
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
      </div>

      {/* Sermons Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Sermon
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Speaker
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Series
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Duration
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Views
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredSermons.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-sm text-gray-500">
                        No sermons found. Click "Add New Sermon" to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredSermons.map((sermon) => (
                      <tr key={sermon.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            {sermon.image_url ? (
                              <img
                                src={sermon.image_url}
                                alt={sermon.title}
                                className="h-10 w-10 rounded-lg object-cover mr-3"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                                <MusicalNoteIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{sermon.title}</div>
                              <div className="text-gray-500">{sermon.bible_passage}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {sermon.speaker_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {sermon.series || '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(sermon.date_preached)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDuration(sermon.duration)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            sermon.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sermon.is_published ? 'Published' : 'Draft'}
                          </span>
                          {sermon.is_featured && (
                            <StarIconSolid className="h-4 w-4 text-yellow-500 inline ml-1" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {sermon.view_count || 0}
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => toggleFeatured(sermon)}
                            className={`mr-3 ${
                              sermon.is_featured 
                                ? 'text-yellow-600 hover:text-yellow-900' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title={sermon.is_featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <StarIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => togglePublish(sermon)}
                            className={`mr-3 ${
                              sermon.is_published 
                                ? 'text-green-600 hover:text-green-900' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title={sermon.is_published ? 'Unpublish' : 'Publish'}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(sermon)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Edit sermon"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sermon)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete sermon"
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

      {/* Sermon Modal */}
      {showModal && (
        <SermonModal
          sermon={editingSermon}
          speakers={speakers}
          series={series}
          imagePreview={imagePreview}
          audioFile={audioFile}
          notesFile={notesFile}
          onAudioChange={(e) => handleFileChange(e, 'audio')}
          onImageChange={(e) => handleFileChange(e, 'image')}
          onNotesChange={(e) => handleFileChange(e, 'notes')}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// Sermon Modal Component
const SermonModal = ({ 
  sermon, speakers, series, imagePreview, 
  onAudioChange, onImageChange, onNotesChange,
  onClose, onSubmit 
}) => {
  const [formData, setFormData] = useState({
    title: sermon?.title || '',
    speaker: sermon?.speaker || '',
    speaker_id: sermon?.speaker_id || '',
    series: sermon?.series || '',
    description: sermon?.description || '',
    bible_passage: sermon?.bible_passage || '',
    date_preached: sermon?.date_preached?.split('T')[0] || '',
    video_url: sermon?.video_url || '',
    duration: sermon?.duration || '',
    tags: sermon?.tags?.join(', ') || '',
    is_published: sermon?.is_published ?? true,
    is_featured: sermon?.is_featured ?? false
  })
  const [loading, setLoading] = useState(false)
  const [newSeries, setNewSeries] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // If new series is entered, use that
    const finalSeries = newSeries || formData.series
    
    await onSubmit({
      ...formData,
      series: finalSeries
    })
    
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            {sermon ? 'Edit Sermon' : 'Add New Sermon'}
          </h3>
          <MusicalNoteIcon className="h-6 w-6 text-indigo-600" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sermon Title *
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>


            {/*Manual Speaker Entry */}
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Speaker Name *
                </label>
                <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.speaker}
                    onChange={(e) => setFormData({...formData, speaker: e.target.value})}
                    placeholder="e.g., Pastor John Doe"
                    required
                />
                </div>

            {/* New Series Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or Create New Series
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newSeries}
                onChange={(e) => setNewSeries(e.target.value)}
                placeholder="Enter new series name"
              />
            </div>

            {/* Bible Passage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bible Passage
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.bible_passage}
                onChange={(e) => setFormData({...formData, bible_passage: e.target.value})}
                placeholder="e.g., John 3:16"
              />
            </div>

            {/* Date Preached */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Preached *
              </label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.date_preached}
                onChange={(e) => setFormData({...formData, date_preached: e.target.value})}
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                placeholder="e.g., 45"
              />
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL (YouTube/Vimeo)
              </label>
              <input
                type="url"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.video_url}
                onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="e.g., grace, faith, salvation"
              />
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
              placeholder="Brief description of the sermon..."
            />
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Audio Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CloudArrowUpIcon className="h-4 w-4 inline mr-1" />
                Audio File (MP3)
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={onAudioChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {sermon?.audio_url && !audioFile && (
                <p className="mt-1 text-xs text-gray-500">Current file exists</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <PhotoIcon className="h-4 w-4 inline mr-1" />
                Sermon Image
              </label>
              <div className="flex items-center space-x-2">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-10 w-10 object-cover rounded"
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

            {/* Notes Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DocumentIcon className="h-4 w-4 inline mr-1" />
                Sermon Notes (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={onNotesChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
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
                Feature this sermon
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
              {loading ? 'Saving...' : (sermon ? 'Update Sermon' : 'Add Sermon')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SermonsManager