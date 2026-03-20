import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { publicAPI } from '../../lib/supabase'
import { 
  NewspaperIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const NewsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [featuredArticles, setFeaturedArticles] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])

  // Check if we have a article ID in the URL hash
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash) {
      fetchArticleById(hash)
    } else {
      fetchNews()
    }
  }, [location])

  const fetchNews = async () => {
    try {
      setLoading(true)
      setSelectedArticle(null)
      
      // Fetch all published news
      const { data: newsData, error: newsError } = await publicAPI.getNews()
      
      if (newsError) throw newsError

      // Fetch featured news
      const { data: featuredData } = await publicAPI.getFeaturedNews(3)

      // Extract unique categories
      const uniqueCategories = [...new Set(newsData?.map(article => article.category).filter(Boolean))]
      setCategories(uniqueCategories)

      setArticles(newsData || [])
      setFeaturedArticles(featuredData || [])
    } catch (err) {
      console.error('Error fetching news:', err)
      setError('Failed to load news articles. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchArticleById = async (id) => {
    try {
      setLoading(true)
      const { data, error } = await publicAPI.getNewsById(id)
      
      if (error) throw error
      
      if (data) {
        setSelectedArticle(data)
        // Increment view count
        await publicAPI.incrementViewCount?.(id)
      } else {
        setError('Article not found')
      }
    } catch (err) {
      console.error('Error fetching article:', err)
      setError('Failed to load the article. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    // If we're in detail view, go back to list
    if (selectedArticle) {
      navigate('/news')
    }
  }

  const handleShare = async (article) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || article.title,
          url: `${window.location.origin}/news#${article.id}`
        })
      } catch (err) {
        console.log('Share cancelled:', err)
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/news#${article.id}`)
      alert('Link copied to clipboard!')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  // Filter articles by category
  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter(article => article.category === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading news...</p>
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
            <NewspaperIcon className="h-12 w-12 text-red-400 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading News</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => {
                setError(null)
                fetchNews()
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

  // If viewing a single article
  if (selectedArticle) {
    return (
      <ArticleDetail 
        article={selectedArticle} 
        onBack={() => {
          setSelectedArticle(null)
          navigate('/news')
        }}
        onShare={() => handleShare(selectedArticle)}
        formatDate={formatDate}
      />
    )
  }

return (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ paddingTop: '30px' }}>Church News</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest happenings, announcements, and stories from our church community.
          </p>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredArticles.map(article => (
                <Link
                  key={article.id}
                  to={`/news#${article.id}`}
                  className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {article.image_url ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <NewspaperIcon className="h-16 w-16 text-white opacity-50" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center text-sm text-indigo-600 mb-2">
                      <TagIcon className="h-4 w-4 mr-1" />
                      {article.category || 'General'}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {article.summary || article.content?.substring(0, 100)}...
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                       <p>Published on: </p>
                        <CalendarIcon className="h-4 w-4 mr-1" /> 
                        {formatDate(article.published_at || article.created_at)}
                      </div>
                      <div className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {article.view_count || 0}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All News
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* News Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <NewspaperIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No news articles</h3>
            <p className="mt-1 text-sm text-gray-500">
              Check back soon for updates and announcements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map(article => (
              <article
                key={article.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => navigate(`/news#${article.id}`)}
              >
                {/* Article Image */}
                {article.image_url ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <NewspaperIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}

                {/* Article Content */}
                <div className="p-6">
                  {/* Category and Date */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {article.category || 'General'}
                    </span>
                    <span className="text-sm text-gray-500">
                      <p>Published on: </p>
                      {formatDate(article.published_at || article.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h2>

                  {/* Summary */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.summary || article.content}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      {article.author_name || 'Church Admin'}
                    </div>
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {article.view_count || 0} views
                    </div>
                  </div>

                  {/* Read More */}
                  <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium">
                    Read More
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Article Detail Component
const ArticleDetail = ({ article, onBack, onShare, formatDate }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-indigo-600"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to News
        </button>

        {/* Article Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Hero Image */}
          {article.image_url ? (
            <div className="h-96 overflow-hidden">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-64 bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <NewspaperIcon className="h-24 w-24 text-white opacity-50" />
            </div>
          )}

          {/* Article Content */}
          <div className="p-8">
            {/* Category and Date */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {article.category || 'General'}
              </span>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <p>Published on: </p>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(article.published_at || article.created_at)}
                </div>
                <div className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {article.view_count || 0} views
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>

            {/* Author */}
            <div className="flex items-center mb-6 pb-6 border-b border-gray-200">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {article.author_name || 'Church Admin'}
                </p>
                <p className="text-xs text-gray-500">Author</p>
              </div>
            </div>

            {/* Article Body */}
            <div className="prose prose-indigo max-w-none">
              {article.summary && (
                <div className="text-lg text-gray-700 italic mb-6 border-l-4 border-indigo-500 pl-4">
                  {article.summary}
                </div>
              )}
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {article.content}
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={onShare}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Share Article
              </button>
            </div>
          </div>
        </div>

        {/* Related Articles - You could add this later */}
      </div>
    </div>
  )
}

export default NewsPage