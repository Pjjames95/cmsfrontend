import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { publicAPI } from '../../lib/supabase'
import { 
  UserGroupIcon,
  MusicalNoteIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  PhotoIcon,
  TrophyIcon,
  StarIcon,
  ClockIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { format, parseISO } from 'date-fns'

const ChoirHistoryPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('members')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Data states
  const [members, setMembers] = useState([])
  const [leaders, setLeaders] = useState([])
  const [performances, setPerformances] = useState([])
  const [achievements, setAchievements] = useState([])
  const [statistics, setStatistics] = useState({
    totalMembers: 0,
    totalPerformances: 0,
    totalAchievements: 0,
    totalLeaders: 0
  })
  
  // Selected item for detail view
  const [selectedPerformance, setSelectedPerformance] = useState(null)
  const [selectedAchievement, setSelectedAchievement] = useState(null)
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('')
  const [voicePartFilter, setVoicePartFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const voiceParts = [
    { value: 'soprano', label: 'Soprano', icon: '🎵', color: 'bg-pink-100 text-pink-800', borderColor: 'border-pink-500' },
    { value: 'alto', label: 'Alto', icon: '🎵', color: 'bg-purple-100 text-purple-800', borderColor: 'border-purple-500' },
    { value: 'tenor', label: 'Tenor', icon: '🎵', color: 'bg-blue-100 text-blue-800', borderColor: 'border-blue-500' },
    { value: 'bass', label: 'Bass', icon: '🎵', color: 'bg-green-100 text-green-800', borderColor: 'border-green-500' },
    { value: 'other', label: 'Other', icon: '🎤', color: 'bg-gray-100 text-gray-800', borderColor: 'border-gray-500' }
  ]

  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash) {
      if (hash.startsWith('performance-')) {
        const id = hash.replace('performance-', '')
        fetchPerformanceById(id)
      } else if (hash.startsWith('achievement-')) {
        const id = hash.replace('achievement-', '')
        fetchAchievementById(id)
      } else {
        fetchAllData()
      }
    } else {
      fetchAllData()
    }
  }, [location])

  const fetchAllData = async () => {
    setLoading(true)
    setSelectedPerformance(null)
    setSelectedAchievement(null)
    
    try {
      const [
        membersRes,
        leadersRes,
        performancesRes,
        achievementsRes,
        statsRes
      ] = await Promise.all([
        publicAPI.getChoirMembers(),
        publicAPI.getChoirLeaders(),
        publicAPI.getChoirPerformances(20),
        publicAPI.getChoirAchievements(),
        publicAPI.getChoirStatistics()
      ])

      if (membersRes.error) throw membersRes.error
      if (leadersRes.error) throw leadersRes.error
      if (performancesRes.error) throw performancesRes.error
      if (achievementsRes.error) throw achievementsRes.error

      setMembers(membersRes.data || [])
      setLeaders(leadersRes.data || [])
      setPerformances(performancesRes.data || [])
      setAchievements(achievementsRes.data || [])
      setStatistics(statsRes)
    } catch (err) {
      console.error('Error fetching choir data:', err)
      setError('Failed to load choir information. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPerformanceById = async (id) => {
    setLoading(true)
    try {
      const { data, error } = await publicAPI.getChoirPerformanceById(id)
      if (error) throw error
      setSelectedPerformance(data)
      setActiveTab('performances')
    } catch (err) {
      console.error('Error fetching performance:', err)
      setError('Performance not found')
    } finally {
      setLoading(false)
    }
  }

  const fetchAchievementById = async (id) => {
    setLoading(true)
    try {
      const { data, error } = await publicAPI.getChoirAchievementById(id)
      if (error) throw error
      setSelectedAchievement(data)
      setActiveTab('achievements')
    } catch (err) {
      console.error('Error fetching achievement:', err)
      setError('Achievement not found')
    } finally {
      setLoading(false)
    }
  }

  const getVoicePartInfo = (voicePart) => {
    return voiceParts.find(v => v.value === voicePart) || voiceParts[4]
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available'
    return format(parseISO(dateString), 'MMMM d, yyyy')
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    return timeString.substring(0, 5)
  }

  // Filter members
  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name} ${member.last_name} ${member.middle_name || ''}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesVoicePart = voicePartFilter === 'all' || member.voice_part === voicePartFilter
    
    return matchesSearch && matchesVoicePart
  })

  // Group members by voice part
  const membersByVoicePart = voiceParts.reduce((acc, vp) => {
    acc[vp.value] = members.filter(m => m.voice_part === vp.value)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading choir history...</p>
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
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Content</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => {
                setError(null)
                fetchAllData()
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

  // Performance Detail View
  if (selectedPerformance) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => {
              setSelectedPerformance(null)
              navigate('/choir')
            }}
            className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-indigo-600"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Choir History
          </button>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedPerformance.title}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-2 text-indigo-500" />
                  <span>{formatDate(selectedPerformance.performance_date)}</span>
                </div>
                {selectedPerformance.venue && (
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    <span>{selectedPerformance.venue}</span>
                  </div>
                )}
                {selectedPerformance.conductor && (
                  <div className="flex items-center text-gray-600">
                    <UserIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    <span>Conducted by {selectedPerformance.conductor}</span>
                  </div>
                )}
                {selectedPerformance.attendance && (
                  <div className="flex items-center text-gray-600">
                    <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    <span>{selectedPerformance.attendance} attendees</span>
                  </div>
                )}
              </div>

              {selectedPerformance.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About the Performance</h3>
                  <p className="text-gray-600">{selectedPerformance.description}</p>
                </div>
              )}

              {selectedPerformance.songs_performed?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Songs Performed</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {selectedPerformance.songs_performed.map((song, index) => (
                        <li key={index} className="flex items-center text-gray-700">
                          <MusicalNoteIcon className="h-4 w-4 mr-2 text-indigo-500" />
                          {song}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedPerformance.notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Notes</h3>
                  <p className="text-gray-600 italic">{selectedPerformance.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Achievement Detail View
  if (selectedAchievement) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => {
              setSelectedAchievement(null)
              navigate('/choir')
            }}
            className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-indigo-600"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Choir History
          </button>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {selectedAchievement.photo_url && (
              <div className="h-96 overflow-hidden">
                <img
                  src={selectedAchievement.photo_url}
                  alt={selectedAchievement.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{selectedAchievement.title}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedAchievement.achievement_type === 'award' ? 'bg-yellow-100 text-yellow-800' :
                  selectedAchievement.achievement_type === 'milestone' ? 'bg-blue-100 text-blue-800' :
                  selectedAchievement.achievement_type === 'recognition' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  <TrophyIcon className="h-4 w-4 mr-1" />
                  {selectedAchievement.achievement_type}
                </span>
              </div>

              {selectedAchievement.achievement_date && (
                <div className="flex items-center text-gray-600 mb-4">
                  <CalendarIcon className="h-5 w-5 mr-2 text-indigo-500" />
                  <span>Achieved on {formatDate(selectedAchievement.achievement_date)}</span>
                </div>
              )}

              <p className="text-gray-600 text-lg leading-relaxed">{selectedAchievement.description}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ paddingTop: '30px' }}>Choir History</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Celebrating our journey of praise and worship through music. Meet our members, explore our performances, and discover our achievements.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center transform hover:scale-105 transition-transform">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{statistics.totalMembers}</h3>
            <p className="text-sm text-gray-500">Active Members</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center transform hover:scale-105 transition-transform">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 mb-4">
              <StarIcon className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{statistics.totalLeaders}</h3>
            <p className="text-sm text-gray-500">Choir Leaders</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center transform hover:scale-105 transition-transform">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-600 mb-4">
              <MusicalNoteIcon className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{statistics.totalPerformances}</h3>
            <p className="text-sm text-gray-500">Performances</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center transform hover:scale-105 transition-transform">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 text-yellow-600 mb-4">
              <TrophyIcon className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{statistics.totalAchievements}</h3>
            <p className="text-sm text-gray-500">Achievements</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab('members')}
              className={`${
                activeTab === 'members'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Our Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('performances')}
              className={`${
                activeTab === 'performances'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <MusicalNoteIcon className="h-5 w-5 inline mr-2" />
              Performances ({performances.length})
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`${
                activeTab === 'achievements'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <TrophyIcon className="h-5 w-5 inline mr-2" />
              Achievements ({achievements.length})
            </button>
          </nav>
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            {/* Leaders Section */}
            {leaders.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Choir Leadership</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leaders.map((leader) => (
                    <div
                      key={leader.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1"
                    >
                      <div className="p-6">
                        <div className="flex items-center space-x-4">
                          {leader.photo_url ? (
                            <img
                              src={leader.photo_url}
                              alt={`${leader.first_name} ${leader.last_name}`}
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                              <UserIcon className="h-8 w-8 text-indigo-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {leader.first_name} {leader.last_name}
                            </h3>
                            <p className="text-sm text-indigo-600">Choir Leader</p>
                            {leader.voice_part && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                getVoicePartInfo(leader.voice_part).color
                              }`}>
                                {getVoicePartInfo(leader.voice_part).label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search members by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                >
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filter by Voice
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setVoicePartFilter('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        voicePartFilter === 'all'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All Voices
                    </button>
                    {voiceParts.map(vp => (
                      <button
                        key={vp.value}
                        onClick={() => setVoicePartFilter(vp.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          voicePartFilter === vp.value
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {vp.icon} {vp.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Members by Voice Part */}
            {voicePartFilter === 'all' ? (
              <div className="space-y-12">
                {voiceParts.map(vp => {
                  const voiceMembers = membersByVoicePart[vp.value]
                  if (voiceMembers.length === 0) return null

                  return (
                    <div key={vp.value}>
                      <h3 className={`text-xl font-bold mb-6 pb-2 border-b-2 ${vp.borderColor}`}>
                        <span className={vp.color.split(' ')[0] + ' px-3 py-1 rounded-full'}>
                          {vp.icon} {vp.label} Section ({voiceMembers.length})
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {voiceMembers.map((member) => (
                          <div
                            key={member.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all"
                          >
                            <div className="p-6">
                              <div className="flex items-center space-x-3">
                                {member.photo_url ? (
                                  <img
                                    src={member.photo_url}
                                    alt={`${member.first_name} ${member.last_name}`}
                                    className="h-12 w-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserIcon className="h-6 w-6 text-gray-500" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {member.first_name} {member.last_name}
                                  </h4>
                                  {member.join_date && (
                                    <p className="text-xs text-gray-500">
                                      Member since {formatDate(member.join_date)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {(member.email || member.phone) && (
                                <div className="mt-3 space-y-1">
                                  {member.email && (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                                      <a href={`mailto:${member.email}`} className="hover:text-indigo-600">
                                        {member.email}
                                      </a>
                                    </div>
                                  )}
                                  {member.phone && (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                                      <a href={`tel:${member.phone}`} className="hover:text-indigo-600">
                                        {member.phone}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-3">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={`${member.first_name} ${member.last_name}`}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {member.first_name} {member.last_name}
                          </h4>
                          {member.join_date && (
                            <p className="text-xs text-gray-500">
                              Member since {formatDate(member.join_date)}
                            </p>
                          )}
                        </div>
                      </div>

                      {(member.email || member.phone) && (
                        <div className="mt-3 space-y-1">
                          {member.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                              <a href={`mailto:${member.email}`} className="hover:text-indigo-600">
                                {member.email}
                              </a>
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                              <a href={`tel:${member.phone}`} className="hover:text-indigo-600">
                                {member.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Performances Tab */}
        {activeTab === 'performances' && (
          <div className="space-y-6">
            {performances.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No performances yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back soon for updates on our upcoming performances.
                </p>
              </div>
            ) : (
              performances.map((performance) => (
                <div
                  key={performance.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/choir#performance-${performance.id}`)}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {performance.title}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4 mr-2 text-indigo-500" />
                            {formatDate(performance.performance_date)}
                          </div>
                          {performance.venue && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPinIcon className="h-4 w-4 mr-2 text-indigo-500" />
                              {performance.venue}
                            </div>
                          )}
                          {performance.conductor && (
                            <div className="flex items-center text-sm text-gray-600">
                              <UserIcon className="h-4 w-4 mr-2 text-indigo-500" />
                              {performance.conductor}
                            </div>
                          )}
                        </div>

                        {performance.description && (
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {performance.description}
                          </p>
                        )}

                        {performance.songs_performed && performance.songs_performed.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {performance.songs_performed.slice(0, 3).map((song, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {song}
                              </span>
                            ))}
                            {performance.songs_performed.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{performance.songs_performed.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400 md:ml-4 mt-2 md:mt-0" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No achievements yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Our journey of excellence is just beginning.
                </p>
              </div>
            ) : (
              achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
                  onClick={() => navigate(`/choir#achievement-${achievement.id}`)}
                >
                  {achievement.photo_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={achievement.photo_url}
                        alt={achievement.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {achievement.title}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        achievement.achievement_type === 'award' ? 'bg-yellow-100 text-yellow-800' :
                        achievement.achievement_type === 'milestone' ? 'bg-blue-100 text-blue-800' :
                        achievement.achievement_type === 'recognition' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {achievement.achievement_type}
                      </span>
                    </div>
                    
                    {achievement.achievement_date && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(achievement.achievement_date)}
                      </div>
                    )}

                    <p className="text-gray-600 text-sm line-clamp-3">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChoirHistoryPage