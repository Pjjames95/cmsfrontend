import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { publicAPI } from '../../../lib/supabase'
import { BuildingOfficeIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const MinistriesPreview = () => {
  const [ministries, setMinistries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMinistries()
  }, [])

  const fetchMinistries = async () => {
    try {
      const { data } = await publicAPI.getMinistries()
      setMinistries(data?.slice(0, 3) || []) // Show first 3 ministries
    } catch (error) {
      console.error('Error fetching ministries:', error)
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

  if (ministries.length === 0) return null

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Ministries</h2>
          <p className="mt-4 text-lg text-gray-600">
            Get involved and grow in your faith through our various ministries
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => (
            <Link
              key={ministry.id}
              to={`/ministries#${ministry.id}`}
              className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-48 bg-gray-200">
                {ministry.image_url ? (
                  <img
                    src={ministry.image_url}
                    alt={ministry.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
                    <BuildingOfficeIcon className="h-16 w-16 text-white opacity-50" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{ministry.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{ministry.description}</p>
                <span className="text-indigo-600 font-medium group-hover:text-indigo-800">
                  Learn more <ChevronRightIcon className="inline h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/ministries"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View All Ministries
          </Link>
        </div>
      </div>
    </div>
  )
}

export default MinistriesPreview