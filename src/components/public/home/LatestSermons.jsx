import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { publicAPI } from '../../../lib/supabase'
import { MusicalNoteIcon, UserIcon, CalendarIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const LatestSermons = () => {
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSermons()
  }, [])

  const fetchSermons = async () => {
    try {
      const { data } = await publicAPI.getSermons()
      setSermons(data?.slice(0, 3) || []) // Show latest 3 sermons
    } catch (error) {
      console.error('Error fetching sermons:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (sermons.length === 0) return null

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Latest Sermons</h2>
          <p className="mt-4 text-lg text-gray-600">
            Listen to our most recent messages and grow in your faith
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {sermons.map((sermon) => (
            <Link
              key={sermon.id}
              to={`/sermons#${sermon.id}`}
              className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              {sermon.image_url ? (
                <div className="h-48 overflow-hidden">
                  <img
                    src={sermon.image_url}
                    alt={sermon.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-48 bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <MusicalNoteIcon className="h-16 w-16 text-white opacity-50" />
                </div>
              )}
              <div className="p-6">
                {sermon.series && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-2">
                    {sermon.series}
                  </span>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {sermon.title}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {sermon.speaker}
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(sermon.date_preached)}
                </div>
                <p className="text-gray-600 line-clamp-2">
                  {sermon.description}
                </p>
                <div className="mt-4 flex items-center text-indigo-600 font-medium">
                  Listen Now
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/sermons"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View All Sermons
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LatestSermons