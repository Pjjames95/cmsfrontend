import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  BookOpenIcon,
  MusicalNoteIcon,
  DocumentIcon,
  PhotoIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  StarIcon,
  LanguageIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

const HymnBooksManager = () => {
  const { adminUser } = useAdminAuth()
  const [hymnBooks, setHymnBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingHymnBook, setEditingHymnBook] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [languages, setLanguages] = useState([])

  // File upload states
  const [coverFile, setCoverFile] = useState(null)
  const [hymnFile, setHymnFile] = useState(null) // Changed from pdfFile to hymnFile
  const [coverPreview, setCoverPreview] = useState(null)

  useEffect(() => {
    fetchHymnBooks()
  }, [])

  const fetchHymnBooks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('hymn_books')
        .select('*')
        .order('title', { ascending: true })
      
      if (error) throw error

      // Extract unique languages
      const uniqueLanguages = [...new Set(data.map(h => h.language).filter(Boolean))]
      setLanguages(uniqueLanguages)

      setHymnBooks(data || [])
    } catch (error) {
      console.error('Error fetching hymn books:', error)
      toast.error('Failed to load hymn books')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingHymnBook(null)
    setCoverPreview(null)
    setCoverFile(null)
    setHymnFile(null)
    setShowModal(true)
  }

  const handleEdit = (hymnBook) => {
    setEditingHymnBook(hymnBook)
    setCoverPreview(hymnBook.cover_image_url)
    setCoverFile(null)
    setHymnFile(null)
    setShowModal(true)
  }

  const handleDelete = async (hymnBook) => {
    if (!confirm(`Are you sure you want to delete the hymn book "${hymnBook.title}"?`)) return

    try {
      // Delete associated files
      const filesToDelete = []
      if (hymnBook.cover_image_url) filesToDelete.push(hymnBook.cover_image_url.split('/').pop())
      if (hymnBook.pdf_url) filesToDelete.push(hymnBook.pdf_url.split('/').pop())

      if (filesToDelete.length > 0) {
        await supabase.storage
          .from('hymn-covers')
          .remove(filesToDelete)
      }

      const { error } = await supabase
        .from('hymn_books')
        .delete()
        .eq('id', hymnBook.id)
      
      if (error) throw error
      
      toast.success('Hymn book deleted successfully')
      fetchHymnBooks()
    } catch (error) {
      console.error('Error deleting hymn book:', error)
      toast.error('Failed to delete hymn book')
    }
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 50MB for all files)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
      return
    }

    switch(type) {
      case 'cover':
        setCoverFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setCoverPreview(reader.result)
        }
        reader.readAsDataURL(file)
        break
      case 'hymn':
        setHymnFile(file)
        break
    }
  }

  const uploadFile = async (file, bucket, folder) => {
    try {
      if (!file) return null
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error(`Error uploading to ${bucket}:`, error)
      toast.error(`Failed to upload file: ${error.message}`)
      throw error
    }
  }

  const handleSubmit = async (formData) => {
    try {
      let coverUrl = editingHymnBook?.cover_image_url || null
      let fileUrl = editingHymnBook?.pdf_url || null

      // Upload new files if selected
      if (coverFile) {
        if (editingHymnBook?.cover_image_url) {
          const oldPath = editingHymnBook.cover_image_url.split('/').pop()
          await supabase.storage
            .from('hymn-covers')
            .remove([oldPath])
        }
        coverUrl = await uploadFile(coverFile, 'hymn-covers', 'covers')
      }
      
      if (hymnFile) {
        if (editingHymnBook?.pdf_url) {
          const oldPath = editingHymnBook.pdf_url.split('/').pop()
          await supabase.storage
            .from('hymn-pdfs')
            .remove([oldPath])
        }
        fileUrl = await uploadFile(hymnFile, 'hymn-pdfs', 'pdfs')
      }

      const hymnBookData = {
        title: formData.title,
        description: formData.description,
        author: formData.author,
        publisher: formData.publisher,
        publication_year: parseInt(formData.publication_year) || null,
        total_hymns: parseInt(formData.total_hymns) || null,
        cover_image_url: coverUrl,
        pdf_url: fileUrl,
        language: formData.language,
        is_public: formData.is_public,
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString()
      }

      if (editingHymnBook) {
        // Update existing hymn book
        const { error } = await supabase
          .from('hymn_books')
          .update(hymnBookData)
          .eq('id', editingHymnBook.id)
        
        if (error) throw error
        toast.success('Hymn book updated successfully')
      } else {
        // Create new hymn book
        const { error } = await supabase
          .from('hymn_books')
          .insert([{
            ...hymnBookData,
            created_by: adminUser?.id,
            created_at: new Date().toISOString(),
            view_count: 0,
            download_count: 0
          }])
        
        if (error) throw error
        toast.success('Hymn book created successfully')
      }
      
      setShowModal(false)
      fetchHymnBooks()
    } catch (error) {
      console.error('Error saving hymn book:', error)
      toast.error('Failed to save hymn book: ' + (error.message || 'Unknown error'))
    }
  }

  const togglePublic = async (hymnBook) => {
    try {
      const { error } = await supabase
        .from('hymn_books')
        .update({ 
          is_public: !hymnBook.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', hymnBook.id)
      
      if (error) throw error
      
      toast.success(`Hymn book ${hymnBook.is_public ? 'hidden from' : 'visible to'} public`)
      fetchHymnBooks()
    } catch (error) {
      console.error('Error toggling public status:', error)
      toast.error('Failed to update hymn book status')
    }
  }

  const toggleFeatured = async (hymnBook) => {
    try {
      const { error } = await supabase
        .from('hymn_books')
        .update({ 
          is_featured: !hymnBook.is_featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', hymnBook.id)
      
      if (error) throw error
      
      toast.success(`Hymn book ${hymnBook.is_featured ? 'removed from' : 'added to'} featured`)
      fetchHymnBooks()
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast.error('Failed to update featured status')
    }
  }

  // Filter hymn books based on search and filters
  const filteredHymnBooks = hymnBooks.filter(book => {
    const matchesSearch = 
      book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLanguage = languageFilter === 'all' || book.language === languageFilter
    
    return matchesSearch && matchesLanguage
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Hymn Books Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Upload and manage hymn books, including PDFs, Word documents, and other file formats.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Hymn Book
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <input
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Search hymn books by title, author, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
          >
            <option value="all">All Languages</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hymn Books Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredHymnBooks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hymn books</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new hymn book.
            </p>
          </div>
        ) : (
          filteredHymnBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Cover Image */}
              <div className="h-48 bg-gray-200 relative">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
                    <BookOpenIcon className="h-16 w-16 text-white opacity-50" />
                  </div>
                )}
                {/* Status Badges */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  {book.is_featured && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <StarIconSolid className="h-3 w-3 mr-1" />
                      Featured
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    book.is_public 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {book.is_public ? 'Public' : 'Hidden'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">{book.title}</h3>
                
                {book.author && (
                  <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                )}

                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {book.description}
                </p>

                {/* Details */}
                <div className="space-y-1 mb-3">
                  {book.language && (
                    <div className="flex items-center text-xs text-gray-500">
                      <LanguageIcon className="h-3 w-3 mr-1" />
                      {book.language}
                    </div>
                  )}
                  {book.total_hymns && (
                    <div className="flex items-center text-xs text-gray-500">
                      <MusicalNoteIcon className="h-3 w-3 mr-1" />
                      {book.total_hymns} hymns
                    </div>
                  )}
                  {book.publication_year && (
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Published {book.publication_year}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center">
                    <EyeIcon className="h-3 w-3 mr-1" />
                    {book.view_count || 0}
                  </div>
                  <div className="flex items-center">
                    <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                    {book.download_count || 0}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center border-t pt-3">
                  <button
                    onClick={() => togglePublic(book)}
                    className={`text-xs font-semibold ${
                      book.is_public 
                        ? 'text-yellow-600 hover:text-yellow-800' 
                        : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {book.is_public ? 'Hide' : 'Make Public'}
                  </button>
                  <div>
                    <button
                      onClick={() => toggleFeatured(book)}
                      className={`mr-3 ${
                        book.is_featured 
                          ? 'text-yellow-600 hover:text-yellow-900' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={book.is_featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <StarIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(book)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Edit hymn book"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(book)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete hymn book"
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

      {/* Hymn Book Modal */}
      {showModal && (
        <HymnBookModal
          hymnBook={editingHymnBook}
          languages={languages}
          coverPreview={coverPreview}
          onCoverChange={(e) => handleFileChange(e, 'cover')}
          onHymnFileChange={(e) => handleFileChange(e, 'hymn')}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// Hymn Book Modal Component
const HymnBookModal = ({ hymnBook, languages, coverPreview, onCoverChange, onHymnFileChange, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: hymnBook?.title || '',
    description: hymnBook?.description || '',
    author: hymnBook?.author || '',
    publisher: hymnBook?.publisher || '',
    publication_year: hymnBook?.publication_year || '',
    total_hymns: hymnBook?.total_hymns || '',
    language: hymnBook?.language || 'English',
    is_public: hymnBook?.is_public ?? true,
    is_featured: hymnBook?.is_featured ?? false
  })
  const [loading, setLoading] = useState(false)
  const [newLanguage, setNewLanguage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // If new language is entered, use that
    const finalLanguage = newLanguage || formData.language
    
    await onSubmit({
      ...formData,
      language: finalLanguage
    })
    
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            {hymnBook ? 'Edit Hymn Book' : 'Add New Hymn Book'}
          </h3>
          <BookOpenIcon className="h-6 w-6 text-indigo-600" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Basic Info - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author/Compiler
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                placeholder="e.g., John Wesley"
              />
            </div>

            {/* Publisher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publisher
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.publisher}
                onChange={(e) => setFormData({...formData, publisher: e.target.value})}
              />
            </div>

            {/* Publication Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publication Year
              </label>
              <input
                type="number"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.publication_year}
                onChange={(e) => setFormData({...formData, publication_year: e.target.value})}
                placeholder="e.g., 2024"
                min="1000"
                max="2100"
              />
            </div>

            {/* Total Hymns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Hymns
              </label>
              <input
                type="number"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.total_hymns}
                onChange={(e) => setFormData({...formData, total_hymns: e.target.value})}
                placeholder="e.g., 500"
                min="1"
              />
            </div>

            {/* Language - Select or Create */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.language}
                onChange={(e) => setFormData({...formData, language: e.target.value})}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Latin">Latin</option>
                <option value="Swahili">Swahili</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* New Language Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or Create New Language
              </label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Enter new language"
              />
            </div>
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
              placeholder="Brief description of the hymn book..."
            />
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <PhotoIcon className="h-4 w-4 inline mr-1" />
                Cover Image
              </label>
              <div className="flex items-center space-x-2">
                {coverPreview && (
                  <img
                    src={coverPreview}
                    alt="Preview"
                    className="h-12 w-12 object-cover rounded"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onCoverChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </div>

            {/* Hymn Book File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DocumentIcon className="h-4 w-4 inline mr-1" />
                Hymn Book File (PDF, DOC, DOCX, EPUB, etc.)
              </label>
              <input
                type="file"
                accept="*/*"
                onChange={onHymnFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {hymnBook?.pdf_url && (
                <p className="mt-1 text-xs text-gray-500">
                  Current file: {hymnBook.pdf_url.split('/').pop()}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Accepted formats: Any file type (PDF, DOC, DOCX, EPUB, etc.) • Max size: 50MB
              </p>
            </div>
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
                Feature this hymn book
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
              {loading ? 'Saving...' : (hymnBook ? 'Update Hymn Book' : 'Add Hymn Book')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HymnBooksManager