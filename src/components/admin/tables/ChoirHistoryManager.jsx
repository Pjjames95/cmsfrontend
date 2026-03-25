import React, { useState, useEffect } from 'react'
import { supabase, sanitizedDb } from '../../../lib/supabaseClient'
import { publicAPI } from '../../../lib/publicAPI'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  UserGroupIcon,
  MusicalNoteIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  PhotoIcon,
  StarIcon,
  TrophyIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

const ChoirHistoryManager = () => {
  const { adminUser } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('members')
  const [loading, setLoading] = useState(true)
  
  // Members state
  const [members, setMembers] = useState([])
  const [performances, setPerformances] = useState([])
  const [rehearsals, setRehearsals] = useState([])
  const [achievements, setAchievements] = useState([])
  const [attendance, setAttendance] = useState([])
  
  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  const [showRehearsalModal, setShowRehearsalModal] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  
  // Editing states
  const [editingMember, setEditingMember] = useState(null)
  const [editingPerformance, setEditingPerformance] = useState(null)
  const [editingRehearsal, setEditingRehearsal] = useState(null)
  const [editingAchievement, setEditingAchievement] = useState(null)
  
  // File upload states
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('')
  const [voicePartFilter, setVoicePartFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const voiceParts = [
    { value: 'soprano', label: 'Soprano', color: 'bg-pink-100 text-pink-800' },
    { value: 'alto', label: 'Alto', color: 'bg-purple-100 text-purple-800' },
    { value: 'tenor', label: 'Tenor', color: 'bg-blue-100 text-blue-800' },
    { value: 'bass', label: 'Bass', color: 'bg-green-100 text-green-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ]

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchMembers(),
        fetchPerformances(),
        fetchRehearsals(),
        fetchAchievements(),
        fetchAttendance()
      ])
    } catch (error) {
      console.error('Error fetching choir data:', error)
      toast.error('Failed to load choir data')
    } finally {
      setLoading(false)
    }
  }

  // Members functions
  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('choir_members')
      .select('*')
      .order('last_name', { ascending: true })
    
    if (error) throw error
    setMembers(data || [])
  }

  const fetchPerformances = async () => {
    const { data, error } = await supabase
      .from('choir_performances')
      .select('*')
      .order('performance_date', { ascending: false })
    
    if (error) throw error
    setPerformances(data || [])
  }

  const fetchRehearsals = async () => {
    const { data, error } = await supabase
      .from('choir_rehearsals')
      .select('*')
      .order('rehearsal_date', { ascending: false })
    
    if (error) throw error
    setRehearsals(data || [])
  }

  const fetchAchievements = async () => {
    const { data, error } = await supabase
      .from('choir_achievements')
      .select('*')
      .order('achievement_date', { ascending: false })
    
    if (error) throw error
    setAchievements(data || [])
  }

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('choir_attendance')
      .select(`
        *,
        member:member_id (first_name, last_name),
        performance:performance_id (title, performance_date),
        rehearsal:rehearsal_id (rehearsal_date)
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (error) throw error
    setAttendance(data || [])
  }

  // File upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const uploadPhoto = async (file, folder) => {
    try {
      if (!file) return null

      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('choir-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('choir-photos')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      throw error
    }
  }

  // Member CRUD
  const handleAddMember = () => {
    setEditingMember(null)
    setPhotoPreview(null)
    setPhotoFile(null)
    setShowMemberModal(true)
  }

  const handleEditMember = (member) => {
    setEditingMember(member)
    setPhotoPreview(member.photo_url)
    setPhotoFile(null)
    setShowMemberModal(true)
  }

  const handleDeleteMember = async (member) => {
    if (!confirm(`Are you sure you want to delete ${member.first_name} ${member.last_name}?`)) return

    try {
      if (member.photo_url) {
        const oldPath = member.photo_url.split('/').pop()
        await supabase.storage
          .from('choir-photos')
          .remove([oldPath])
      }

      const { error } = await supabase
        .from('choir_members')
        .delete()
        .eq('id', member.id)
      
      if (error) throw error
      
      toast.success('Member deleted successfully')
      fetchMembers()
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error('Failed to delete member')
    }
  }

  const handleSubmitMember = async (formData) => {
    try {
      let photoUrl = editingMember?.photo_url || null

      if (photoFile) {
        if (editingMember?.photo_url) {
          const oldPath = editingMember.photo_url.split('/').pop()
          await supabase.storage
            .from('choir-photos')
            .remove([oldPath])
        }
        photoUrl = await uploadPhoto(photoFile, 'members')
      }

      const memberData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || null,
        date_of_birth: formData.date_of_birth || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        voice_part: formData.voice_part || null,
        join_date: formData.join_date,
        exit_date: formData.exit_date || null,
        is_active: formData.is_active,
        is_leader: formData.is_leader || false,
        photo_url: photoUrl,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      }

      if (editingMember) {
        const { error } = await supabase
          .from('choir_members')
          .update(memberData)
          .eq('id', editingMember.id)
        
        if (error) throw error
        toast.success('Member updated successfully')
      } else {
        const { error } = await supabase
          .from('choir_members')
          .insert([{
            ...memberData,
            created_by: adminUser?.id,
            created_at: new Date().toISOString()
          }])
        
        if (error) throw error
        toast.success('Member added successfully')
      }
      
      setShowMemberModal(false)
      fetchMembers()
    } catch (error) {
      console.error('Error saving member:', error)
      toast.error('Failed to save member')
    }
  }

  // Performance CRUD
  const handleAddPerformance = () => {
    setEditingPerformance(null)
    setShowPerformanceModal(true)
  }

  const handleEditPerformance = (performance) => {
    setEditingPerformance(performance)
    setShowPerformanceModal(true)
  }

  const handleDeletePerformance = async (performance) => {
    if (!confirm(`Are you sure you want to delete the performance "${performance.title}"?`)) return

    try {
      const { error } = await supabase
        .from('choir_performances')
        .delete()
        .eq('id', performance.id)
      
      if (error) throw error
      
      toast.success('Performance deleted successfully')
      fetchPerformances()
    } catch (error) {
      console.error('Error deleting performance:', error)
      toast.error('Failed to delete performance')
    }
  }

  const handleSubmitPerformance = async (formData) => {
    try {
      const songsPerformed = formData.songs_performed 
        ? formData.songs_performed.split('\n').map(s => s.trim()).filter(s => s)
        : []

      const performanceData = {
        title: formData.title,
        description: formData.description || null,
        performance_date: formData.performance_date,
        venue: formData.venue || null,
        event_type: formData.event_type,
        songs_performed: songsPerformed,
        conductor: formData.conductor || null,
        attendance: parseInt(formData.attendance) || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      }

      if (editingPerformance) {
        const { error } = await supabase
          .from('choir_performances')
          .update(performanceData)
          .eq('id', editingPerformance.id)
        
        if (error) throw error
        toast.success('Performance updated successfully')
      } else {
        const { error } = await supabase
          .from('choir_performances')
          .insert([{
            ...performanceData,
            created_by: adminUser?.id,
            created_at: new Date().toISOString()
          }])
        
        if (error) throw error
        toast.success('Performance added successfully')
      }
      
      setShowPerformanceModal(false)
      fetchPerformances()
    } catch (error) {
      console.error('Error saving performance:', error)
      toast.error('Failed to save performance')
    }
  }

  // Rehearsal CRUD
  const handleAddRehearsal = () => {
    setEditingRehearsal(null)
    setShowRehearsalModal(true)
  }

  const handleEditRehearsal = (rehearsal) => {
    setEditingRehearsal(rehearsal)
    setShowRehearsalModal(true)
  }

  const handleDeleteRehearsal = async (rehearsal) => {
    if (!confirm(`Are you sure you want to delete the rehearsal on ${rehearsal.rehearsal_date}?`)) return

    try {
      const { error } = await supabase
        .from('choir_rehearsals')
        .delete()
        .eq('id', rehearsal.id)
      
      if (error) throw error
      
      toast.success('Rehearsal deleted successfully')
      fetchRehearsals()
    } catch (error) {
      console.error('Error deleting rehearsal:', error)
      toast.error('Failed to delete rehearsal')
    }
  }

  const handleSubmitRehearsal = async (formData) => {
    try {
      const songsPracticed = formData.songs_practiced 
        ? formData.songs_practiced.split('\n').map(s => s.trim()).filter(s => s)
        : []

      const rehearsalData = {
        rehearsal_date: formData.rehearsal_date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        location: formData.location || null,
        attendance: parseInt(formData.attendance) || null,
        songs_practiced: songsPracticed,
        conductor: formData.conductor || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      }

      if (editingRehearsal) {
        const { error } = await supabase
          .from('choir_rehearsals')
          .update(rehearsalData)
          .eq('id', editingRehearsal.id)
        
        if (error) throw error
        toast.success('Rehearsal updated successfully')
      } else {
        const { error } = await supabase
          .from('choir_rehearsals')
          .insert([{
            ...rehearsalData,
            created_by: adminUser?.id,
            created_at: new Date().toISOString()
          }])
        
        if (error) throw error
        toast.success('Rehearsal added successfully')
      }
      
      setShowRehearsalModal(false)
      fetchRehearsals()
    } catch (error) {
      console.error('Error saving rehearsal:', error)
      toast.error('Failed to save rehearsal')
    }
  }

  // Achievement CRUD
  const handleAddAchievement = () => {
    setEditingAchievement(null)
    setPhotoPreview(null)
    setPhotoFile(null)
    setShowAchievementModal(true)
  }

  const handleEditAchievement = (achievement) => {
    setEditingAchievement(achievement)
    setPhotoPreview(achievement.photo_url)
    setPhotoFile(null)
    setShowAchievementModal(true)
  }

  const handleDeleteAchievement = async (achievement) => {
    if (!confirm(`Are you sure you want to delete the achievement "${achievement.title}"?`)) return

    try {
      if (achievement.photo_url) {
        const oldPath = achievement.photo_url.split('/').pop()
        await supabase.storage
          .from('choir-photos')
          .remove([oldPath])
      }

      const { error } = await supabase
        .from('choir_achievements')
        .delete()
        .eq('id', achievement.id)
      
      if (error) throw error
      
      toast.success('Achievement deleted successfully')
      fetchAchievements()
    } catch (error) {
      console.error('Error deleting achievement:', error)
      toast.error('Failed to delete achievement')
    }
  }

  const handleSubmitAchievement = async (formData) => {
    try {
      let photoUrl = editingAchievement?.photo_url || null

      if (photoFile) {
        if (editingAchievement?.photo_url) {
          const oldPath = editingAchievement.photo_url.split('/').pop()
          await supabase.storage
            .from('choir-photos')
            .remove([oldPath])
        }
        photoUrl = await uploadPhoto(photoFile, 'achievements')
      }

      const achievementData = {
        title: formData.title,
        description: formData.description || null,
        achievement_date: formData.achievement_date || null,
        achievement_type: formData.achievement_type,
        photo_url: photoUrl,
        updated_at: new Date().toISOString()
      }

      if (editingAchievement) {
        const { error } = await supabase
          .from('choir_achievements')
          .update(achievementData)
          .eq('id', editingAchievement.id)
        
        if (error) throw error
        toast.success('Achievement updated successfully')
      } else {
        const { error } = await supabase
          .from('choir_achievements')
          .insert([{
            ...achievementData,
            created_by: adminUser?.id,
            created_at: new Date().toISOString()
          }])
        
        if (error) throw error
        toast.success('Achievement added successfully')
      }
      
      setShowAchievementModal(false)
      fetchAchievements()
    } catch (error) {
      console.error('Error saving achievement:', error)
      toast.error('Failed to save achievement')
    }
  }

  // Filter members
  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name} ${member.last_name} ${member.middle_name || ''}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm)
    
    const matchesVoicePart = voicePartFilter === 'all' || member.voice_part === voicePartFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && member.is_active) ||
      (statusFilter === 'inactive' && !member.is_active)
    
    return matchesSearch && matchesVoicePart && matchesStatus
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return format(parseISO(dateString), 'MMM d, yyyy')
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    return timeString.substring(0, 5)
  }

  const getVoicePartInfo = (voicePart) => {
    return voiceParts.find(v => v.value === voicePart) || voiceParts[4]
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
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Choir History Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage choir members, performances, rehearsals, and achievements.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-indigo-500 rounded-md p-3">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
                  <dd className="text-lg font-semibold text-gray-900">{members.length}</dd>
                  <dd className="text-xs text-gray-400">
                    {members.filter(m => m.is_active).length} active
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-green-500 rounded-md p-3">
                <MusicalNoteIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Performances</dt>
                  <dd className="text-lg font-semibold text-gray-900">{performances.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-yellow-500 rounded-md p-3">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rehearsals</dt>
                  <dd className="text-lg font-semibold text-gray-900">{rehearsals.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 bg-purple-500 rounded-md p-3">
                <TrophyIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Achievements</dt>
                  <dd className="text-lg font-semibold text-gray-900">{achievements.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('members')}
            className={`${
              activeTab === 'members'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <UserGroupIcon className="h-5 w-5 inline mr-2" />
            Members
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
            Performances
          </button>
          <button
            onClick={() => setActiveTab('rehearsals')}
            className={`${
              activeTab === 'rehearsals'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <ClockIcon className="h-5 w-5 inline mr-2" />
            Rehearsals
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
            Achievements
          </button>
        </nav>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          <div className="sm:flex sm:items-center sm:justify-between mb-4">
            <div className="sm:flex-auto">
              <p className="text-sm text-gray-700">
                Manage choir members, their voice parts, and contact information.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleAddMember}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Member
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-4 flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                showFilters 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Voice Part</label>
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={voicePartFilter}
                    onChange={(e) => setVoicePartFilter(e.target.value)}
                  >
                    <option value="all">All Voice Parts</option>
                    {voiceParts.map(vp => (
                      <option key={vp.value} value={vp.value}>{vp.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Members</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Members Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => {
              const voicePartInfo = getVoicePartInfo(member.voice_part)
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={`${member.first_name} ${member.last_name}`}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </h3>
                          {member.middle_name && (
                            <p className="text-sm text-gray-500">{member.middle_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {member.is_leader && (
                          <StarIconSolid className="h-5 w-5 text-yellow-500" title="Choir Leader" />
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {member.voice_part && (
                        <div className="flex items-center text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${voicePartInfo.color}`}>
                            {voicePartInfo.label}
                          </span>
                        </div>
                      )}
                      {member.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <a href={`mailto:${member.email}`} className="hover:text-indigo-600">
                            {member.email}
                          </a>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <a href={`tel:${member.phone}`} className="hover:text-indigo-600">
                            {member.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        Joined: {formatDate(member.join_date)}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="text-indigo-600 hover:text-indigo-800"
                        title="Edit member"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete member"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Performances Tab */}
      {activeTab === 'performances' && (
        <div>
          <div className="sm:flex sm:items-center sm:justify-between mb-4">
            <div className="sm:flex-auto">
              <p className="text-sm text-gray-700">
                Track choir performances, concerts, and special events.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleAddPerformance}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Performance
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {performances.map((performance) => (
              <div
                key={performance.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{performance.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{performance.description}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      performance.event_type === 'concert' ? 'bg-purple-100 text-purple-800' :
                      performance.event_type === 'competition' ? 'bg-yellow-100 text-yellow-800' :
                      performance.event_type === 'sunday_service' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {performance.event_type?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(performance.performance_date)}
                    </div>
                    {performance.venue && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {performance.venue}
                      </div>
                    )}
                    {performance.conductor && (
                      <div className="flex items-center text-sm text-gray-600">
                        <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                        Conductor: {performance.conductor}
                      </div>
                    )}
                  </div>

                  {performance.songs_performed?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Songs Performed:</h4>
                      <div className="flex flex-wrap gap-2">
                        {performance.songs_performed.map((song, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {song}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditPerformance(performance)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePerformance(performance)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rehearsals Tab */}
      {activeTab === 'rehearsals' && (
        <div>
          <div className="sm:flex sm:items-center sm:justify-between mb-4">
            <div className="sm:flex-auto">
              <p className="text-sm text-gray-700">
                Schedule and track choir rehearsals.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleAddRehearsal}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Rehearsal
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {rehearsals.map((rehearsal) => (
              <div
                key={rehearsal.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Rehearsal - {formatDate(rehearsal.rehearsal_date)}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(rehearsal.rehearsal_date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {formatTime(rehearsal.start_time)}
                      {rehearsal.end_time && ` - ${formatTime(rehearsal.end_time)}`}
                    </div>
                    {rehearsal.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {rehearsal.location}
                      </div>
                    )}
                    {rehearsal.conductor && (
                      <div className="flex items-center text-sm text-gray-600">
                        <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                        Conductor: {rehearsal.conductor}
                      </div>
                    )}
                  </div>

                  {rehearsal.songs_practiced?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Songs Practiced:</h4>
                      <div className="flex flex-wrap gap-2">
                        {rehearsal.songs_practiced.map((song, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {song}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditRehearsal(rehearsal)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRehearsal(rehearsal)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div>
          <div className="sm:flex sm:items-center sm:justify-between mb-4">
            <div className="sm:flex-auto">
              <p className="text-sm text-gray-700">
                Track choir awards, milestones, and recognitions.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleAddAchievement}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Achievement
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-all"
              >
                {achievement.photo_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={achievement.photo_url}
                      alt={achievement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{achievement.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      achievement.achievement_type === 'award' ? 'bg-yellow-100 text-yellow-800' :
                      achievement.achievement_type === 'milestone' ? 'bg-blue-100 text-blue-800' :
                      achievement.achievement_type === 'recognition' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {achievement.achievement_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                  {achievement.achievement_date && (
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(achievement.achievement_date)}
                    </div>
                  )}
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditAchievement(achievement)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAchievement(achievement)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <MemberModal
          member={editingMember}
          voiceParts={voiceParts}
          photoPreview={photoPreview}
          onPhotoChange={handlePhotoChange}
          onClose={() => setShowMemberModal(false)}
          onSubmit={handleSubmitMember}
        />
      )}

      {/* Performance Modal */}
      {showPerformanceModal && (
        <PerformanceModal
          performance={editingPerformance}
          onClose={() => setShowPerformanceModal(false)}
          onSubmit={handleSubmitPerformance}
        />
      )}

      {/* Rehearsal Modal */}
      {showRehearsalModal && (
        <RehearsalModal
          rehearsal={editingRehearsal}
          onClose={() => setShowRehearsalModal(false)}
          onSubmit={handleSubmitRehearsal}
        />
      )}

      {/* Achievement Modal */}
      {showAchievementModal && (
        <AchievementModal
          achievement={editingAchievement}
          photoPreview={photoPreview}
          onPhotoChange={handlePhotoChange}
          onClose={() => setShowAchievementModal(false)}
          onSubmit={handleSubmitAchievement}
        />
      )}
    </div>
  )
}

// Member Modal Component
const MemberModal = ({ member, voiceParts, photoPreview, onPhotoChange, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    middle_name: member?.middle_name || '',
    date_of_birth: member?.date_of_birth || '',
    email: member?.email || '',
    phone: member?.phone || '',
    address: member?.address || '',
    voice_part: member?.voice_part || '',
    join_date: member?.join_date || new Date().toISOString().split('T')[0],
    exit_date: member?.exit_date || '',
    is_active: member?.is_active ?? true,
    is_leader: member?.is_leader || false,
    emergency_contact_name: member?.emergency_contact_name || '',
    emergency_contact_phone: member?.emergency_contact_phone || '',
    notes: member?.notes || ''
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
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            {member ? 'Edit Member' : 'Add New Member'}
          </h3>
          <UserGroupIcon className="h-6 w-6 text-indigo-600" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.middle_name}
                onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice Part</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.voice_part}
                onChange={(e) => setFormData({...formData, voice_part: e.target.value})}
              >
                <option value="">Select voice part</option>
                {voiceParts.map(vp => (
                  <option key={vp.value} value={vp.value}>{vp.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Date *</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.join_date}
                onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exit Date</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.exit_date}
                onChange={(e) => setFormData({...formData, exit_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
              <input
                type="tel"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member Photo</label>
            <div className="flex items-center space-x-2">
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes about the member..."
            />
          </div>

          {/* Status Toggles */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active Member
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_leader"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.is_leader}
                onChange={(e) => setFormData({...formData, is_leader: e.target.checked})}
              />
              <label htmlFor="is_leader" className="ml-2 block text-sm text-gray-700">
                Choir Leader
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (member ? 'Update Member' : 'Add Member')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Performance Modal Component
const PerformanceModal = ({ performance, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: performance?.title || '',
    description: performance?.description || '',
    performance_date: performance?.performance_date || new Date().toISOString().split('T')[0],
    venue: performance?.venue || '',
    event_type: performance?.event_type || 'sunday_service',
    songs_performed: performance?.songs_performed?.join('\n') || '',
    conductor: performance?.conductor || '',
    attendance: performance?.attendance || '',
    notes: performance?.notes || ''
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
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-lg font-medium mb-4">
          {performance ? 'Edit Performance' : 'Add Performance'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.performance_date}
                onChange={(e) => setFormData({...formData, performance_date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.event_type}
                onChange={(e) => setFormData({...formData, event_type: e.target.value})}
              >
                <option value="sunday_service">Sunday Service</option>
                <option value="special_service">Special Service</option>
                <option value="concert">Concert</option>
                <option value="competition">Competition</option>
                <option value="outreach">Outreach</option>
                <option value="recording">Recording</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conductor</label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.conductor}
                onChange={(e) => setFormData({...formData, conductor: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Songs Performed (one per line)</label>
            <textarea
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.songs_performed}
              onChange={(e) => setFormData({...formData, songs_performed: e.target.value})}
              placeholder="Amazing Grace&#10;How Great Thou Art&#10;Great is Thy Faithfulness"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attendance</label>
            <input
              type="number"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.attendance}
              onChange={(e) => setFormData({...formData, attendance: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
              {loading ? 'Saving...' : (performance ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Rehearsal Modal Component
const RehearsalModal = ({ rehearsal, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    rehearsal_date: rehearsal?.rehearsal_date || new Date().toISOString().split('T')[0],
    start_time: rehearsal?.start_time || '19:00',
    end_time: rehearsal?.end_time || '',
    location: rehearsal?.location || '',
    attendance: rehearsal?.attendance || '',
    songs_practiced: rehearsal?.songs_practiced?.join('\n') || '',
    conductor: rehearsal?.conductor || '',
    notes: rehearsal?.notes || ''
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
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-lg font-medium mb-4">
          {rehearsal ? 'Edit Rehearsal' : 'Add Rehearsal'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.rehearsal_date}
                onChange={(e) => setFormData({...formData, rehearsal_date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conductor</label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.conductor}
              onChange={(e) => setFormData({...formData, conductor: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Songs Practiced (one per line)</label>
            <textarea
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.songs_practiced}
              onChange={(e) => setFormData({...formData, songs_practiced: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attendance</label>
            <input
              type="number"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.attendance}
              onChange={(e) => setFormData({...formData, attendance: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
              {loading ? 'Saving...' : (rehearsal ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Achievement Modal Component
const AchievementModal = ({ achievement, photoPreview, onPhotoChange, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: achievement?.title || '',
    description: achievement?.description || '',
    achievement_date: achievement?.achievement_date || '',
    achievement_type: achievement?.achievement_type || 'award'
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
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-lg font-medium mb-4">
          {achievement ? 'Edit Achievement' : 'Add Achievement'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.achievement_date}
                onChange={(e) => setFormData({...formData, achievement_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.achievement_type}
                onChange={(e) => setFormData({...formData, achievement_type: e.target.value})}
              >
                <option value="award">Award</option>
                <option value="milestone">Milestone</option>
                <option value="recognition">Recognition</option>
                <option value="certification">Certification</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            <div className="flex items-center space-x-2">
              {photoPreview && (
                <img src={photoPreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
              {loading ? 'Saving...' : (achievement ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChoirHistoryManager