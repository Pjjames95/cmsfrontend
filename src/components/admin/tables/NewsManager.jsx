import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  NewspaperIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  PhotoIcon,
  TagIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

const NewsManager = () => {
  const { adminUser } = useAdminAuth()
  const [news, setNews] = useState([])
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNews, setEditingNews] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const categories = [
    'Announcement',
    'Event',
    'Ministry Update',
    'Testimony',
    'Teaching',
    'Community',
    'Other'
  ]

  useEffect(() => {
    fetchNews()
    fetchAuthors()
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      // First, fetch all news articles
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (newsError) throw newsError

      // Then, for each article, fetch the author details separately
      const formattedData = await Promise.all(
        newsData.map(async (article) => {
          let authorName = article.author_name || 'Unknown'
          let authorEmail = ''

          // If author_id exists, try to fetch author details
          if (article.author_id) {
            const { data: authorData } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', article.author_id)
              .single()
            
            if (authorData) {
              authorName = authorData.full_name || authorData.email || authorName
              authorEmail = authorData.email || ''
            }
          }

          return {
            ...article,
            author_name: authorName,
            author_email: authorEmail
          }
        })
      )
      
      setNews(formattedData)
    } catch (error) {
      console.error('Error fetching news:', error)
      toast.error('Failed to load news articles')
    } finally {
      setLoading(false)
    }
  }

  const fetchAuthors = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name', { ascending: true })
      
      if (error) {
        console.error('Error fetching profiles:', error)
        // Fallback: get unique author_ids from news table
        const { data: newsData } = await supabase
          .from('news')
          .select('author_id, author_name')
        
        if (newsData) {
          const uniqueAuthors = Array.from(
            new Map(
              newsData
                .filter(n => n.author_id)
                .map(n => [n.author_id, { 
                  id: n.author_id, 
                  email: '', 
                  full_name: n.author_name || 'Unknown' 
                }])
            ).values()
          )
          setAuthors(uniqueAuthors)
          return
        }
      }
      
      setAuthors(profiles || [])
    } catch (error) {
      console.error('Error fetching authors:', error)
      setAuthors([])
    }
  }

  const handleAdd = () => {
    setEditingNews(null)
    setImagePreview(null)
    setImageFile(null)
    setShowModal(true)
  }

  const handleEdit = (article) => {
    setEditingNews(article)
    setImagePreview(article.image_url)
    setImageFile(null)
    setShowModal(true)
  }

  const handleDelete = async (article) => {
    if (!confirm(`Are you sure you want to delete the article "${article.title}"?`)) return

    try {
      // Delete image from storage if exists
      if (article.image_url) {
        const imagePath = article.image_url.split('/').pop()
        await supabase.storage
          .from('news')
          .remove([imagePath])
      }

      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', article.id)
      
      if (error) throw error
      
      toast.success('News article deleted successfully')
      fetchNews()
    } catch (error) {
      console.error('Error deleting news:', error)
      toast.error('Failed to delete article')
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
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `news-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('news')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('news')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSubmit = async (formData) => {
    try {
      let imageUrl = editingNews?.image_url || null

      // Upload new image if selected
      if (imageFile) {
        // Delete old image if exists
        if (editingNews?.image_url) {
          const oldImagePath = editingNews.image_url.split('/').pop()
          await supabase.storage
            .from('news')
            .remove([oldImagePath])
        }
        
        imageUrl = await uploadImage(imageFile)
      }

      const newsData = {
        title: formData.title,
        content: formData.content,
        summary: formData.summary,
        author_id: formData.author_id || null,
        author_name: authors.find(a => a.id === formData.author_id)?.full_name || formData.author_name,
        image_url: imageUrl,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        published_at: formData.is_published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }

      if (editingNews) {
        // Update existing article
        const { error } = await supabase
          .from('news')
          .update(newsData)
          .eq('id', editingNews.id)
        
        if (error) throw error
        toast.success('News article updated successfully')
      } else {
        // Create new article
        const { error } = await supabase
          .from('news')
          .insert([{
            ...newsData,
            created_by: adminUser?.id,
            created_at: new Date().toISOString(),
            view_count: 0
          }])
        
        if (error) throw error
        toast.success('News article created successfully')
      }
      
      setShowModal(false)
      fetchNews()
    } catch (error) {
      console.error('Error saving news:', error)
      toast.error('Failed to save article: ' + (error.message || 'Unknown error'))
    }
  }

  const togglePublish = async (article) => {
    try {
      const { error } = await supabase
        .from('news')
        .update({ 
          is_published: !article.is_published,
          published_at: !article.is_published ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', article.id)
      
      if (error) throw error
      
      toast.success(`Article ${article.is_published ? 'unpublished' : 'published'} successfully`)
      fetchNews()
    } catch (error) {
      console.error('Error toggling publish status:', error)
      toast.error('Failed to update article status')
    }
  }

  const toggleFeatured = async (article) => {
    try {
      const { error } = await supabase
        .from('news')
        .update({ 
          is_featured: !article.is_featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', article.id)
      
      if (error) throw error
      
      toast.success(`Article ${article.is_featured ? 'removed from' : 'added to'} featured`)
      fetchNews()
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast.error('Failed to update featured status')
    }
  }

  // Filter news based on search and filters
  const filteredNews = news.filter(article => {
    const matchesSearch = 
      article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && article.is_published) ||
      (statusFilter === 'draft' && !article.is_published)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'Not published'
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
          <h1 className="text-2xl font-semibold text-gray-900">News Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage church news articles, announcements, and updates.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Write New Article
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <input
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Search articles by title, content, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
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

      {/* News Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Article
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Author
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
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
                  {filteredNews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                        No news articles found. Click "Write New Article" to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredNews.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            {article.image_url ? (
                              <img
                                src={article.image_url}
                                alt={article.title}
                                className="h-10 w-10 rounded-lg object-cover mr-3"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                                <NewspaperIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{article.title}</div>
                              <div className="text-gray-500">{article.summary?.substring(0, 60)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {article.author_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                            {article.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            article.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {article.is_published ? 'Published' : 'Draft'}
                          </span>
                          {article.is_featured && (
                            <StarIconSolid className="h-4 w-4 text-yellow-500 inline ml-1" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(article.published_at || article.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {article.view_count || 0}
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => toggleFeatured(article)}
                            className={`mr-3 ${
                              article.is_featured 
                                ? 'text-yellow-600 hover:text-yellow-900' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title={article.is_featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <StarIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => togglePublish(article)}
                            className={`mr-3 ${
                              article.is_published 
                                ? 'text-green-600 hover:text-green-900' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title={article.is_published ? 'Unpublish' : 'Publish'}
                          >
                            <NewspaperIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(article)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Edit article"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(article)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete article"
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

      {/* News Modal */}
      {showModal && (
        <NewsModal
          article={editingNews}
          authors={authors}
          categories={categories}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// News Modal Component
const NewsModal = ({ article, authors, categories, imagePreview, onImageChange, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: article?.title || '',
    content: article?.content || '',
    summary: article?.summary || '',
    author_id: article?.author_id || '',
    author_name: article?.author_name || '',
    category: article?.category || categories[0],
    tags: article?.tags?.join(', ') || '',
    is_published: article?.is_published ?? false,
    is_featured: article?.is_featured ?? false
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
            {article ? 'Edit Article' : 'Write New Article'}
          </h3>
          <NewspaperIcon className="h-6 w-6 text-indigo-600" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
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

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary
            </label>
            <textarea
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              placeholder="Brief summary of the article..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              rows={6}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
              placeholder="Write your article content here..."
            />
          </div>

          {/* Two columns for metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.author_id}
                onChange={(e) => {
                  const author = authors.find(a => a.id === e.target.value)
                  setFormData({
                    ...formData,
                    author_id: e.target.value,
                    author_name: author?.full_name || ''
                  })
                }}
              >
                <option value="">Select an author</option>
                {authors.map(author => (
                  <option key={author.id} value={author.id}>
                    {author.full_name || author.email || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
                placeholder="e.g., events, announcements, ministry"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Featured Image
              </label>
              <div className="flex items-center space-x-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded-lg"
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
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
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
                Feature this article
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
              {loading ? 'Saving...' : (article ? 'Update Article' : 'Publish Article')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewsManager