import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Public data fetching functions (no auth required)
// In src/lib/supabase.js, replace the entire publicAPI object with this:

export const publicAPI = {
  // News functions
  getNews: async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
    return { data, error }
  },

  getNewsById: async (id) => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single()
    return { data, error }
  },

  getFeaturedNews: async (limit = 3) => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(limit)
    return { data, error }
  },


  // Get all published sermons
  getSermons: async () => {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('is_published', true)
      .order('date_preached', { ascending: false })
    return { data, error }
  },

  // Get single sermon by ID
  getSermonById: async (id) => {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single()
    return { data, error }
  },

  // Get featured sermons
  getFeaturedSermons: async (limit = 3) => {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('date_preached', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Get sermons by series
  getSermonsBySeries: async (series, limit = 10) => {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('is_published', true)
      .eq('series', series)
      .order('date_preached', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Get all unique series
  getAllSeries: async () => {
    const { data, error } = await supabase
      .from('sermons')
      .select('series')
      .eq('is_published', true)
      .not('series', 'is', null)
    if (error) return { data: [], error }
    const uniqueSeries = [...new Set(data.map(item => item.series).filter(Boolean))]
    return { data: uniqueSeries, error: null }
  },

  // Increment view count
  incrementSermonViewCount: async (id) => {
    const { data, error } = await supabase.rpc('increment_sermon_views', { 
      sermon_id: id 
    })
    return { data, error }
  },

  // Ministries functions
  getMinistries: async () => {
    const { data, error } = await supabase
      .from('ministries')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
    return { data, error }
  },

  getMinistryById: async (id) => {
    const { data, error } = await supabase
      .from('ministries')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()
    return { data, error }
  },

  // Hymn Books functions
    // Hymn Books functions
  getHymnBooks: async () => {
    const { data, error } = await supabase
      .from('hymn_books')
      .select('*')
      .eq('is_public', true)
      .order('title', { ascending: true })
    return { data, error }
  },

  // Get single hymn book by ID
  getHymnBookById: async (id) => {
    const { data, error } = await supabase
      .from('hymn_books')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single()
    return { data, error }
  },
 

  getFeaturedHymnBooks: async (limit = 3) => {
    const { data, error } = await supabase
      .from('hymn_books')
      .select('*')
      .eq('is_public', true)
      .eq('is_featured', true)
      .order('title', { ascending: true })
      .limit(limit)
    return { data, error }
  },
  // Increment hymn book view count
  incrementHymnBookViewCount: async (id) => {
    const { data, error } = await supabase.rpc('increment_hymn_book_views', { 
      book_id: id 
    })
    return { data, error }
  },

  getHymnBookLanguages: async () => {
    const { data, error } = await supabase
      .from('hymn_books')
      .select('language')
      .eq('is_public', true)
      .not('language', 'is', null)
    
    if (error) return { data: [], error }
    const uniqueLanguages = [...new Set(data.map(item => item.language).filter(Boolean))].sort()
    return { data: uniqueLanguages, error: null }
  },

  // Service Program functions - UPDATED with correct table name
  getServices: async () => {
    const { data, error } = await supabase
      .from('service_programs')  // Fixed: was 'serviceprogram'
      .select('*')
      .eq('is_published', true)
      .order('service_date', { ascending: true })
      .order('start_time', { ascending: true })
    return { data, error }
  },

  getUpcomingServices: async (limit = 10) => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('service_programs')  // Fixed: was 'serviceprogram'
      .select('*')
      .eq('is_published', true)
      .gte('service_date', today)
      .order('service_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(limit)
    return { data, error }
  },

  getServicesByDateRange: async (startDate, endDate) => {
    const { data, error } = await supabase
      .from('service_programs')  // Fixed: was 'serviceprogram'
      .select('*')
      .eq('is_published', true)
      .gte('service_date', startDate)
      .lte('service_date', endDate)
      .order('service_date', { ascending: true })
      .order('start_time', { ascending: true })
    return { data, error }
  },

  getServiceById: async (id) => {
    const { data, error } = await supabase
      .from('service_programs')  // Fixed: was 'serviceprogram'
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single()
    return { data, error }
  },

  getFeaturedServices: async (limit = 3) => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('service_programs')  // Fixed: was 'serviceprogram'
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .gte('service_date', today)
      .order('service_date', { ascending: true })
      .limit(limit)
    return { data, error }
  },

  getServicesByType: async (type, limit = 10) => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('service_programs')  // Fixed: was 'serviceprogram'
      .select('*')
      .eq('is_published', true)
      .eq('service_type', type)
      .gte('service_date', today)
      .order('service_date', { ascending: true })
      .limit(limit)
    return { data, error }
  },

  // Projects functions
  getProjects: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Increment functions
  incrementSermonViewCount: async (id) => {
    const { data, error } = await supabase.rpc('increment_sermon_views', { 
      sermon_id: id 
    })
    return { data, error }
  },

  incrementHymnBookViewCount: async (id) => {
    const { data, error } = await supabase.rpc('increment_hymn_book_views', { 
      book_id: id 
    })
    return { data, error }
  },

  incrementHymnBookDownloadCount: async (id) => {
    const { data, error } = await supabase.rpc('increment_hymn_book_downloads', { 
      book_id: id 
    })
    return { data, error }
  },

  // Get all public projects
  getProjects: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get featured projects
  getFeaturedProjects: async (limit = 3) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_public', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Get single project by ID
  getProjectById: async (id) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single()
    return { data, error }
  },

  // Get projects by status
  getProjectsByStatus: async (status) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_public', true)
      .eq('status', status)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Increment project view count
  incrementProjectViewCount: async (id) => {
    const { data, error } = await supabase.rpc('increment_project_views', { 
      project_id: id 
    })
    return { data, error }
  },

  // Get all active choir members
  getChoirMembers: async () => {
    const { data, error } = await supabase
      .from('choir_members')
      .select('*')
      .eq('is_active', true)
      .order('voice_part', { ascending: true })
      .order('last_name', { ascending: true })
    return { data, error }
  },

  // Get choir leaders
  getChoirLeaders: async () => {
    const { data, error } = await supabase
      .from('choir_members')
      .select('*')
      .eq('is_active', true)
      .eq('is_leader', true)
      .order('last_name', { ascending: true })
    return { data, error }
  },

  // Get choir members by voice part
  getChoirMembersByVoicePart: async (voicePart) => {
    const { data, error } = await supabase
      .from('choir_members')
      .select('*')
      .eq('is_active', true)
      .eq('voice_part', voicePart)
      .order('last_name', { ascending: true })
    return { data, error }
  },

  // Get all performances
  getChoirPerformances: async (limit = 20) => {
    const { data, error } = await supabase
      .from('choir_performances')
      .select('*')
      .order('performance_date', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Get performance by ID
  getChoirPerformanceById: async (id) => {
    const { data, error } = await supabase
      .from('choir_performances')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Get upcoming performances
  getUpcomingPerformances: async (limit = 5) => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('choir_performances')
      .select('*')
      .gte('performance_date', today)
      .order('performance_date', { ascending: true })
      .limit(limit)
    return { data, error }
  },

  // Get past performances
  getPastPerformances: async (limit = 10) => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('choir_performances')
      .select('*')
      .lt('performance_date', today)
      .order('performance_date', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Get all achievements
  getChoirAchievements: async () => {
    const { data, error } = await supabase
      .from('choir_achievements')
      .select('*')
      .order('achievement_date', { ascending: false })
    return { data, error }
  },

  // Get achievement by ID
  getChoirAchievementById: async (id) => {
    const { data, error } = await supabase
      .from('choir_achievements')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Get upcoming rehearsals (if you want to make them public)
  getUpcomingRehearsals: async (limit = 5) => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('choir_rehearsals')
      .select('*')
      .gte('rehearsal_date', today)
      .order('rehearsal_date', { ascending: true })
      .limit(limit)
    return { data, error }
  },

  // Get choir statistics
  getChoirStatistics: async () => {
    const [
      membersRes,
      performancesRes,
      achievementsRes,
      leadersRes
    ] = await Promise.all([
      supabase.from('choir_members').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('choir_performances').select('*', { count: 'exact', head: true }),
      supabase.from('choir_achievements').select('*', { count: 'exact', head: true }),
      supabase.from('choir_members').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_leader', true)
    ])

    return {
      totalMembers: membersRes.count || 0,
      totalPerformances: performancesRes.count || 0,
      totalAchievements: achievementsRes.count || 0,
      totalLeaders: leadersRes.count || 0
    }
  },

// Submit a ministry registration
submitMinistryRegistration: async (registrationData) => {
  const { data, error } = await supabase
    .from('ministry_registrations')
    .insert([registrationData])
    .select()
    .single()
  return { data, error }
},

// Check if user has already registered for a ministry
checkExistingRegistration: async (ministryId, email) => {
  try {
    // Add a timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const { data, error } = await supabase
      .from('ministry_registrations')
      .select('id, status')
      .eq('ministry_id', ministryId)
      .eq('email', email)
      .maybeSingle()
      .abortSignal(controller.signal)

    clearTimeout(timeoutId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error checking registration:', error)
    return { data: null, error }
  }
},

// Get registration by email (for checking status)
getRegistrationByEmail: async (email) => {
  const { data, error } = await supabase
    .from('ministry_registrations')
    .select(`
      *,
      ministry:ministry_id (
        name,
        description
      )
    `)
    .eq('email', email)
    .order('created_at', { ascending: false })
  return { data, error }
}
}

// Test the connection
export const testConnection = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials')
    }
    
    const { error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('⚠️ Profiles table not found - this is okay if you haven\'t created it yet')
        console.log('✅ Supabase client initialized successfully')
        return true
      }
      throw error
    }
    
    console.log('✅ Supabase connection successful - profiles table accessible')
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
    return false
  }
}