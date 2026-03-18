import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { publicAPI } from '../../lib/supabase'
import { 
  BuildingOfficeIcon, 
  UserIcon, 
  ClockIcon, 
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const MinistriesPage = () => {
  const [ministries, setMinistries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMinistry, setSelectedMinistry] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMinistries()
  }, [])

  const fetchMinistries = async () => {
    try {
      setLoading(true)
      const { data, error } = await publicAPI.getMinistries()
      
      if (error) throw error
      
      setMinistries(data || [])
    } catch (err) {
      console.error('Error fetching ministries:', err)
      setError('Failed to load ministries. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading ministries...</p>
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
            <BuildingOfficeIcon className="h-12 w-12 text-red-400 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Ministries</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchMinistries}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If a ministry is selected, show detail view
  if (selectedMinistry) {
    return (
      <MinistryDetail 
        ministry={selectedMinistry} 
        onBack={() => setSelectedMinistry(null)} 
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Ministries</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the various ways you can get involved and grow in your faith through our diverse ministries.
          </p>
        </div>

        {ministries.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No ministries available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Check back soon for updates on our church ministries.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-12">
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="text-center">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Ministries</dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600">{ministries.length}</dd>
                </div>
                <div className="text-center">
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Leaders</dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                    {ministries.filter(m => m.leader_name || m.leader).length}
                  </dd>
                </div>
                <div className="text-center">
                  <dt className="text-sm font-medium text-gray-500 truncate">Meeting Locations</dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                    {new Set(ministries.map(m => m.meeting_location).filter(Boolean)).size}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Ministries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ministries.map((ministry) => (
                <div
                  key={ministry.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setSelectedMinistry(ministry)}
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
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
                        <BuildingOfficeIcon className="h-16 w-16 text-white opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{ministry.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{ministry.description}</p>

                    {/* Quick Info */}
                    <div className="space-y-2 mb-4">
                      {ministry.leader_name && (
                        <div className="flex items-center text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 mr-2 text-indigo-500" />
                          <span>{ministry.leader_name}</span>
                        </div>
                      )}
                      {ministry.meeting_time && (
                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-2 text-indigo-500" />
                          <span>{ministry.meeting_time}</span>
                        </div>
                      )}
                      {ministry.meeting_location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-2 text-indigo-500" />
                          <span>{ministry.meeting_location}</span>
                        </div>
                      )}
                    </div>

                    {/* Learn More Link */}
                    <div className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      <span>Learn more</span>
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Ministry Detail Component
const MinistryDetail = ({ ministry, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-indigo-600"
        >
          <ChevronRightIcon className="h-4 w-4 mr-1 rotate-180" />
          Back to Ministries
        </button>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Hero Image */}
          <div className="h-64 bg-gray-200 relative">
            {ministry.image_url ? (
              <img
                src={ministry.image_url}
                alt={ministry.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600">
                <BuildingOfficeIcon className="h-24 w-24 text-white opacity-50" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{ministry.name}</h1>
            
            <div className="prose max-w-none mb-8">
              <p className="text-gray-600">{ministry.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leader Info */}
              {(ministry.leader_name || ministry.leader) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Ministry Leader</h3>
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-medium text-gray-900">
                        {ministry.leader_name || ministry.leader?.full_name}
                      </p>
                      {(ministry.contact_email || ministry.leader?.email) && (
                        <a 
                          href={`mailto:${ministry.contact_email || ministry.leader?.email}`}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center mt-1"
                        >
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          {ministry.contact_email || ministry.leader?.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Meeting Info */}
              {(ministry.meeting_time || ministry.meeting_location) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Meeting Details</h3>
                  {ministry.meeting_time && (
                    <div className="flex items-center mb-2">
                      <ClockIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      <span className="text-gray-700">{ministry.meeting_time}</span>
                    </div>
                  )}
                  {ministry.meeting_location && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      <span className="text-gray-700">{ministry.meeting_location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Info */}
              {(ministry.contact_email || ministry.contact_phone) && (
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ministry.contact_email && (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-5 w-5 text-indigo-600 mr-2" />
                        <a 
                          href={`mailto:${ministry.contact_email}`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {ministry.contact_email}
                        </a>
                      </div>
                    )}
                    {ministry.contact_phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-indigo-600 mr-2" />
                        <a 
                          href={`tel:${ministry.contact_phone}`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {ministry.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Call to Action */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interested in Joining?</h3>
              <div className="mt-6">
                <Link
                  to={`/ministries/register/${ministry.id}`}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {/* <UserGroupIcon className="h-5 w-5 mr-2" /> */}
                  Join This Ministry
                </Link>
              </div>
              <div className="flex flex-wrap gap-4">
                <a
                  href={`mailto:${ministry.contact_email || ministry.leader?.email || 'info@church.org'}`}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Contact Ministry Leader
                </a>
                <button
                  onClick={onBack}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Browse Other Ministries
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MinistriesPage