import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { publicAPI } from '../../../lib/supabase'
import { BookOpenIcon, MusicalNoteIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const HymnsPreview = () => {
  const [hymnBooks, setHymnBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHymnBooks()
  }, [])

  const fetchHymnBooks = async () => {
    try {
      const { data } = await publicAPI.getFeaturedHymnBooks(3)
      setHymnBooks(data || [])
    } catch (error) {
      console.error('Error fetching hymn books:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (hymnBooks.length === 0) return null

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Hymn Books</h2>
          <p className="mt-4 text-lg text-gray-600">
            Explore our collection of sacred hymns and spiritual songs
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {hymnBooks.map((book) => (
            <Link
              key={book.id}
              to={`/hymns#${book.id}`}
              className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
                    <BookOpenIcon className="h-16 w-16 text-white opacity-50" />
                  </div>
                )}
                <span className="absolute top-2 right-2 bg-white bg-opacity-90 text-xs font-medium px-2 py-1 rounded-full text-gray-700">
                  {book.language}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="text-sm text-indigo-600 mb-2">by {book.author}</p>
                )}
                <p className="text-gray-600 line-clamp-2 mb-3">
                  {book.description}
                </p>
                {book.total_hymns && (
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MusicalNoteIcon className="h-4 w-4 mr-1" />
                    {book.total_hymns} hymns
                  </div>
                )}
                <div className="flex items-center text-indigo-600 font-medium">
                  Browse Hymns
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/hymns"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View All Hymn Books
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HymnsPreview