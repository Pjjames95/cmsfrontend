import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { publicAPI } from '../../lib/supabase'
import { 
  MusicalNoteIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ClockIcon,
  BookOpenIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { PlayIcon as PlayIconSolid } from '@heroicons/react/24/solid'

const SermonsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const audioRef = useRef(null)
  
  const [sermons, setSermons] = useState([])
  const [featuredSermons, setFeaturedSermons] = useState([])
  const [selectedSermon, setSelectedSermon] = useState(null)
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSeries, setSelectedSeries] = useState('all')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)

  // Check if we have a sermon ID in the URL hash
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash) {
      fetchSermonById(hash)
    } else {
      fetchSermons()
    }
  }, [location])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ''
      }
    }
  }, [currentAudio])

  const fetchSermons = async () => {
    try {
      setLoading(true)
      setSelectedSermon(null)
      
      // Fetch all published sermons
      const { data: sermonsData, error: sermonsError } = await publicAPI.getSermons()
      
      if (sermonsError) throw sermonsError

      // Fetch featured sermons
      const { data: featuredData } = await publicAPI.getFeaturedSermons(3)

      // Fetch all series
      const { data: seriesData } = await publicAPI.getAllSeries()

      setSermons(sermonsData || [])
      setFeaturedSermons(featuredData || [])
      setSeries(seriesData || [])
    } catch (err) {
      console.error('Error fetching sermons:', err)
      setError('Failed to load sermons. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSermonById = async (id) => {
    try {
      setLoading(true)
      const { data, error } = await publicAPI.getSermonById(id)
      
      if (error) throw error
      
      if (data) {
        setSelectedSermon(data)
        // Increment view count
        await publicAPI.incrementSermonViewCount(id)
      } else {
        setError('Sermon not found')
      }
    } catch (err) {
      console.error('Error fetching sermon:', err)
      setError('Failed to load the sermon. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handlePlaySermon = (sermon) => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
    }
    
    if (sermon.audio_url) {
      const audio = new Audio(sermon.audio_url)
      audioRef.current = audio
      setCurrentAudio(audio)
      
      audio.play()
      setIsPlaying(true)
      
      audio.onended = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
      }
    }
  }

  const handleStopAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
      setCurrentAudio(null)
      setIsPlaying(false)
    }
  }

  const handleDownload = async (sermon, type) => {
    try {
      const url = type === 'audio' ? sermon.audio_url : sermon.notes_url
      if (!url) return

      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${sermon.title} - ${sermon.speaker}.${type === 'audio' ? 'mp3' : 'pdf'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      // You could increment download count here
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const handleShare = async (sermon) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: sermon.title,
          text: `Listen to "${sermon.title}" by ${sermon.speaker}`,
          url: `${window.location.origin}/sermons#${sermon.id}`
        })
      } catch (err) {
        console.log('Share cancelled:', err)
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/sermons#${sermon.id}`)
      alert('Link copied to clipboard!')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (minutes) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Filter sermons by series
  const filteredSermons = selectedSeries === 'all'
    ? sermons
    : sermons.filter(sermon => sermon.series === selectedSeries)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sermons...</p>
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
            <MusicalNoteIcon className="h-12 w-12 text-red-400 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Sermons</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => {
                setError(null)
                fetchSermons()
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

  // If viewing a single sermon
  if (selectedSermon) {
    return (
      <SermonDetail 
        sermon={selectedSermon}
        onBack={() => {
          setSelectedSermon(null)
          navigate('/sermons')
          handleStopAudio()
        }}
        onPlay={() => handlePlaySermon(selectedSermon)}
        onStop={handleStopAudio}
        onDownload={handleDownload}
        onShare={() => handleShare(selectedSermon)}
        isPlaying={isPlaying && currentAudio?.src?.includes(selectedSermon.audio_url)}
        formatDate={formatDate}
        formatDuration={formatDuration}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sermons</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Listen to our latest sermons and grow in your faith through God's Word.
          </p>
        </div>

        {/* Featured Sermons */}
        {featuredSermons.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Sermons</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredSermons.map(sermon => (
                <div
                  key={sermon.id}
                  className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/sermons#${sermon.id}`)}
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
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {sermon.title}
                    </h3>
                    <p className="text-sm text-indigo-600 mb-2">{sermon.speaker}</p>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {sermon.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(sermon.date_preached)}
                      </div>
                      <div className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {sermon.view_count || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Series Filter */}
        {series.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSeries('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedSeries === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Sermons
            </button>
            {series.map(seriesName => (
              <button
                key={seriesName}
                onClick={() => setSelectedSeries(seriesName)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSeries === seriesName
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {seriesName}
              </button>
            ))}
          </div>
        )}

        {/* Sermons Grid */}
        {filteredSermons.length === 0 ? (
          <div className="text-center py-12">
            <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No sermons found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Check back soon for new sermon uploads.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSermons.map(sermon => (
              <div
                key={sermon.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => navigate(`/sermons#${sermon.id}`)}
              >
                {/* Sermon Image */}
                {sermon.image_url ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={sermon.image_url}
                      alt={sermon.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <MusicalNoteIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Series Badge */}
                  {sermon.series && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-3">
                      {sermon.series}
                    </span>
                  )}

                  {/* Title */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {sermon.title}
                  </h2>

                  {/* Speaker and Date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-1" />
                      {sermon.speaker}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(sermon.date_preached)}
                    </div>
                  </div>

                  {/* Bible Passage */}
                  {sermon.bible_passage && (
                    <div className="flex items-center text-sm text-indigo-600 mb-2">
                      <BookOpenIcon className="h-4 w-4 mr-1" />
                      {sermon.bible_passage}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {sermon.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    {sermon.duration && (
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDuration(sermon.duration)}
                      </div>
                    )}
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {sermon.view_count || 0} views
                    </div>
                  </div>

                  {/* Listen Now */}
                  <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium">
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Listen Now
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Sermon Detail Component
const SermonDetail = ({ 
  sermon, onBack, onPlay, onStop, onDownload, onShare,
  isPlaying, formatDate, formatDuration 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-indigo-600"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Sermons
        </button>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Hero Image */}
          {sermon.image_url ? (
            <div className="h-64 overflow-hidden">
              <img
                src={sermon.image_url}
                alt={sermon.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-48 bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <MusicalNoteIcon className="h-24 w-24 text-white opacity-50" />
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Series Badge */}
            {sermon.series && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mb-4">
                {sermon.series}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{sermon.title}</h1>

            {/* Speaker and Date */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Speaker</p>
                  <p className="text-sm font-medium text-gray-900">{sermon.speaker}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Date Preached</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(sermon.date_preached)}</p>
                </div>
              </div>
              {sermon.duration && (
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="text-sm font-medium text-gray-900">{formatDuration(sermon.duration)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bible Passage */}
            {sermon.bible_passage && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center">
                  <BookOpenIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  <span className="text-sm font-medium text-indigo-900">Scripture: </span>
                  <span className="ml-2 text-sm text-indigo-800">{sermon.bible_passage}</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="prose max-w-none mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About this Sermon</h3>
              <p className="text-gray-600">{sermon.description}</p>
            </div>

            {/* Audio Player */}
            {sermon.audio_url && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={isPlaying ? onStop : onPlay}
                      className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        isPlaying 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      } text-white transition-colors`}
                    >
                      {isPlaying ? (
                        <XMarkIcon className="h-6 w-6" />
                      ) : (
                        <PlayIconSolid className="h-6 w-6" />
                      )}
                    </button>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {isPlaying ? 'Now Playing' : 'Click to Listen'}
                      </p>
                      <p className="text-xs text-gray-500">{sermon.title}</p>
                    </div>
                  </div>
                  
                  {/* Download Buttons */}
                  <div className="flex space-x-2">
                    {sermon.audio_url && (
                      <button
                        onClick={() => onDownload(sermon, 'audio')}
                        className="p-2 text-gray-600 hover:text-indigo-600"
                        title="Download Audio"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    )}
                    {sermon.notes_url && (
                      <button
                        onClick={() => onDownload(sermon, 'notes')}
                        className="p-2 text-gray-600 hover:text-indigo-600"
                        title="Download Notes"
                      >
                        <BookOpenIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => onShare(sermon)}
                      className="p-2 text-gray-600 hover:text-indigo-600"
                      title="Share"
                    >
                      <ShareIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Video Link */}
            {sermon.video_url && (
              <div className="mb-6">
                <a
                  href={sermon.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Watch on YouTube
                </a>
              </div>
            )}

            {/* Tags */}
            {sermon.tags && sermon.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {sermon.tags.map(tag => (
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

            {/* Stats */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                {sermon.view_count || 0} views
              </div>
              <div className="flex items-center">
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                {sermon.download_count || 0} downloads
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SermonsPage