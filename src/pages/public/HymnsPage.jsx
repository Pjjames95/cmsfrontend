import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { publicAPI } from '../../lib/supabase'
import { 
  BookOpenIcon,
  MusicalNoteIcon,
  DocumentIcon,
  PhotoIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  LanguageIcon,
  CalendarIcon,
  UserIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { BookOpenIcon as BookOpenIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

const HymnsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [hymnBooks, setHymnBooks] = useState([])
  const [featuredBooks, setFeaturedBooks] = useState([])
  const [selectedBook, setSelectedBook] = useState(null)
  const [languages, setLanguages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Check if we have a book ID in the URL hash
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash) {
      fetchHymnBookById(hash)
    } else {
      fetchHymnBooks()
    }
  }, [location])

  const fetchHymnBooks = async () => {
    try {
      setLoading(true)
      setSelectedBook(null)
      
      // Fetch all public hymn books
      const { data: booksData, error: booksError } = await publicAPI.getHymnBooks()
      
      if (booksError) throw booksError

      // Fetch featured hymn books
      const { data: featuredData } = await publicAPI.getFeaturedHymnBooks(4)

      // Fetch all languages
      const { data: languagesData } = await publicAPI.getHymnBookLanguages()

      setHymnBooks(booksData || [])
      setFeaturedBooks(featuredData || [])
      setLanguages(languagesData || [])
    } catch (err) {
      console.error('Error fetching hymn books:', err)
      setError('Failed to load hymn books. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchHymnBookById = async (id) => {
    try {
      setLoading(true)
      const { data, error } = await publicAPI.getHymnBookById(id)
      
      if (error) throw error
      
      if (data) {
        setSelectedBook(data)
        // Increment view count
        await publicAPI.incrementHymnBookViewCount(id)
      } else {
        setError('Hymn book not found')
      }
    } catch (err) {
      console.error('Error fetching hymn book:', err)
      setError('Failed to load the hymn book. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (book) => {
    if (!book.pdf_url) {
      toast.error('No PDF available for this hymn book')
      return
    }

    try {
      // Increment download count
      await publicAPI.incrementHymnBookDownloadCount(book.id)

      // Open PDF in new tab (user can save from there)
      window.open(book.pdf_url, '_blank')
      
      toast.success('Download started')
    } catch (error) {
      console.error('Error downloading:', error)
      toast.error('Failed to download hymn book')
    }
  }

  const handleReadOnline = (book) => {
    if (!book.pdf_url) {
      toast.error('No PDF available for this hymn book')
      return
    }
    
    // Open PDF in new tab for reading
    window.open(book.pdf_url, '_blank')
    
    // Increment view count
    publicAPI.incrementHymnBookViewCount(book.id)
  }

  // Filter hymn books based on search and language
  const filteredBooks = hymnBooks.filter(book => {
    const matchesSearch = searchTerm === '' || 
      book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLanguage = selectedLanguage === 'all' || book.language === selectedLanguage
    
    return matchesSearch && matchesLanguage
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading hymn books...</p>
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
            <BookOpenIcon className="h-12 w-12 text-red-400 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Hymn Books</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => {
                setError(null)
                fetchHymnBooks()
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

  // If viewing a single hymn book
  if (selectedBook) {
    return (
      <HymnBookDetail 
        book={selectedBook}
        onBack={() => {
          setSelectedBook(null)
          navigate('/hymns')
        }}
        onDownload={() => handleDownload(selectedBook)}
        onReadOnline={() => handleReadOnline(selectedBook)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Hymn Books</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse our collection of hymn books. Download PDFs or read online to enrich your worship experience.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search by title, author, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 pr-4 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-3.5"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Language Filter */}
        {languages.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedLanguage('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedLanguage === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Languages
            </button>
            {languages.map(language => (
              <button
                key={language}
                onClick={() => setSelectedLanguage(language)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedLanguage === language
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        )}

        {/* Featured Hymn Books */}
        {featuredBooks.length > 0 && searchTerm === '' && selectedLanguage === 'all' && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Hymn Books</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBooks.map(book => (
                <div
                  key={book.id}
                  className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                  onClick={() => navigate(`/hymns#${book.id}`)}
                >
                  {/* Cover Image */}
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
                        <BookOpenIcon className="h-16 w-16 text-white opacity-50" />
                      </div>
                    )}
                    {/* Language Badge */}
                    <span className="absolute top-2 right-2 bg-white bg-opacity-90 text-xs font-medium px-2 py-1 rounded-full text-gray-700">
                      {book.language}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-sm text-indigo-600 mb-2">by {book.author}</p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {book.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {book.view_count || 0}
                      </div>
                      {book.total_hymns && (
                        <div className="flex items-center">
                          <MusicalNoteIcon className="h-3 w-3 mr-1" />
                          {book.total_hymns} hymns
                        </div>
                      )}
                    </div>

                    {/* View Details */}
                    <div className="mt-3 flex items-center text-indigo-600 text-sm font-medium">
                      View Details
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Hymn Books */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {searchTerm ? 'Search Results' : selectedLanguage === 'all' ? 'All Hymn Books' : `${selectedLanguage} Hymn Books`}
          </h2>
          
          {filteredBooks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No hymn books found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              {(searchTerm || selectedLanguage !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedLanguage('all')
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBooks.map(book => (
                <div
                  key={book.id}
                  className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                  onClick={() => navigate(`/hymns#${book.id}`)}
                >
                  {/* Cover Image */}
                  <div className="h-56 bg-gray-200 relative overflow-hidden">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
                        <BookOpenIcon className="h-20 w-20 text-white opacity-50" />
                      </div>
                    )}
                    {/* Language Badge */}
                    <span className="absolute top-3 right-3 bg-white bg-opacity-90 text-xs font-medium px-2 py-1 rounded-full text-gray-700">
                      {book.language}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                      {book.title}
                    </h3>
                    
                    {/* Author and Year */}
                    <div className="flex items-center justify-between mb-3">
                      {book.author && (
                        <div className="flex items-center text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {book.author}
                        </div>
                      )}
                      {book.publication_year && (
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {book.publication_year}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {book.description}
                    </p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {book.total_hymns && (
                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 rounded p-2">
                          <MusicalNoteIcon className="h-3 w-3 mr-1 shrink-0" />
                          <span className="truncate">{book.total_hymns} hymns</span>
                        </div>
                      )}
                      {book.publisher && (
                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 rounded p-2">
                          <BookOpenIcon className="h-3 w-3 mr-1 shrink-0" />
                          <span className="truncate">{book.publisher}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats and Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          {book.view_count || 0}
                        </div>
                        <div className="flex items-center">
                          <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                          {book.download_count || 0}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {book.pdf_url && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReadOnline(book)
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                              title="Read Online"
                            >
                              Read
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(book)
                              }}
                              className="text-xs text-green-600 hover:text-green-800 font-medium"
                              title="Download PDF"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Hymn Books</dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">{hymnBooks.length}</dd>
            </div>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500 truncate">Languages</dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">{languages.length}</dd>
            </div>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Hymns</dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                {hymnBooks.reduce((sum, book) => sum + (book.total_hymns || 0), 0)}
              </dd>
            </div>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Downloads</dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                {hymnBooks.reduce((sum, book) => sum + (book.download_count || 0), 0)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

// Hymn Book Detail Component
const HymnBookDetail = ({ book, onBack, onDownload, onReadOnline }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-indigo-600"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Hymn Books
        </button>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Left Column - Cover Image */}
            <div className="md:w-1/3 bg-gray-100 p-8 flex items-center justify-center">
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="max-w-full max-h-96 rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center bg-linear-to-br from-indigo-600 to-purple-600 rounded-lg">
                  <BookOpenIcon className="h-32 w-32 text-white opacity-50" />
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="md:w-2/3 p-8">
              {/* Language Badge */}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mb-4">
                <LanguageIcon className="h-4 w-4 mr-1" />
                {book.language}
              </span>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{book.title}</h1>

              {/* Author */}
              {book.author && (
                <p className="text-lg text-gray-700 mb-2">by {book.author}</p>
              )}

              {/* Publisher and Year */}
              {(book.publisher || book.publication_year) && (
                <p className="text-gray-600 mb-4">
                  {book.publisher && <span>{book.publisher}</span>}
                  {book.publisher && book.publication_year && <span> • </span>}
                  {book.publication_year && <span>{book.publication_year}</span>}
                </p>
              )}

              {/* Description */}
              <div className="prose max-w-none mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About this Hymn Book</h3>
                <p className="text-gray-600">{book.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {book.total_hymns && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">Total Hymns</dt>
                    <dd className="mt-1 text-2xl font-semibold text-indigo-600">{book.total_hymns}</dd>
                  </div>
                )}
                {book.view_count > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">Views</dt>
                    <dd className="mt-1 text-2xl font-semibold text-indigo-600">{book.view_count}</dd>
                  </div>
                )}
                {book.download_count > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">Downloads</dt>
                    <dd className="mt-1 text-2xl font-semibold text-indigo-600">{book.download_count}</dd>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {book.pdf_url && (
                <div className="flex space-x-4">
                  <button
                    onClick={onReadOnline}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <BookOpenIcon className="h-5 w-5 mr-2" />
                    Read Online
                  </button>
                  <button
                    onClick={onDownload}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Download PDF
                  </button>
                </div>
              )}

              {/* No PDF Message */}
              {!book.pdf_url && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <DocumentIcon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        PDF version is not available for this hymn book at the moment.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HymnsPage