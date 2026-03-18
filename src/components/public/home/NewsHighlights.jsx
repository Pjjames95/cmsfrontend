import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { publicAPI } from '../../../lib/supabase'
import { NewspaperIcon, CalendarIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const NewsHighlights = () => {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const { data } = await publicAPI.getNews()
      setNews(data?.slice(0, 3) || []) // Show latest 3 news
    } catch (error) {
      console.error('Error fetching news:', error)
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
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (news.length === 0) return null

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Latest News</h2>
          <p className="mt-4 text-lg text-gray-600">
            Stay updated with what's happening in our church community
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <Link
              key={item.id}
              to={`/news#${item.id}`}
              className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              {item.image_url ? (
                <div className="h-48 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-48 bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <NewspaperIcon className="h-16 w-16 text-white opacity-50" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center text-sm text-indigo-600 mb-2">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(item.published_at || item.created_at)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 line-clamp-2">
                  {item.summary || item.content}
                </p>
                <div className="mt-4 flex items-center text-indigo-600 font-medium">
                  Read More
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/news"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View All News
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NewsHighlights