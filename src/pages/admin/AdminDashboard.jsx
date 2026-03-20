import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { supabase } from '../../lib/supabase'
import {
  UserGroupIcon,
  NewspaperIcon,
  MusicalNoteIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  FolderIcon,
  UsersIcon,
  BookOpenIcon,
  TrophyIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const AdminDashboard = () => {
  const { adminRole, adminUser, adminProfile } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [recentActivity, setRecentActivity] = useState([])
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Define which stats each role can see
  const rolePermissions = {
    super_admin: ['users', 'news', 'sermons', 'projects', 'events', 'ministries', 'finances', 'registrations', 'choir', 'hymns'],
    dean: ['users', 'news', 'sermons', 'projects', 'events', 'ministries', 'finances', 'registrations', 'choir', 'hymns'],
    admin: ['users', 'news', 'sermons', 'projects', 'events', 'ministries', 'finances', 'registrations', 'choir', 'hymns'],
    media_admin: ['news', 'sermons', 'hymns', 'choir', 'service_program'],
    financials_admin: ['finances'],
    ministry_leader: ['ministries', 'registrations'],
    secretary_admin: ['events', 'service_program'],
    projects_admin: ['projects'],
    choir_admin: ['choir']
  }

  const visibleStats = rolePermissions[adminRole?.role] || ['users']

  useEffect(() => {
    fetchDashboardData()
    
    // Set up real-time subscriptions for live updates
    const subscriptions = setupRealtimeSubscriptions()
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    
    return () => {
      clearInterval(interval)
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }, [])

  const setupRealtimeSubscriptions = () => {
    const subscriptions = []
    
    // Subscribe to changes in relevant tables based on role
    if (visibleStats.includes('registrations')) {
      const regSub = supabase
        .channel('registrations-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'ministry_registrations' },
          () => fetchDashboardData()
        )
        .subscribe()
      subscriptions.push(regSub)
    }
    
    if (visibleStats.includes('news')) {
      const newsSub = supabase
        .channel('news-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'news' },
          () => fetchDashboardData()
        )
        .subscribe()
      subscriptions.push(newsSub)
    }
    
    // Add more subscriptions as needed
    
    return subscriptions
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const statsData = {}
      const activities = []

      // Fetch real data based on role permissions
      if (visibleStats.includes('users')) {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        if (!error) {
          statsData.users = { 
            total: count || 0, 
            change: await getPercentageChange('profiles', 'created_at'),
            icon: UsersIcon, 
            color: 'indigo',
            link: '/admin/roles'
          }
        }
      }

      if (visibleStats.includes('news')) {
        const { count, error } = await supabase
          .from('news')
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          const { count: published } = await supabase
            .from('news')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true)
          
          const { count: drafts } = await supabase
            .from('news')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', false)
          
          statsData.news = { 
            total: count || 0, 
            change: await getPercentageChange('news', 'created_at'),
            published, 
            drafts,
            icon: NewspaperIcon, 
            color: 'green',
            link: '/admin/news'
          }
        }
      }

      if (visibleStats.includes('sermons')) {
        const { count, error } = await supabase
          .from('sermons')
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          const { count: published } = await supabase
            .from('sermons')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true)
          
          const { count: drafts } = await supabase
            .from('sermons')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', false)
          
          statsData.sermons = { 
            total: count || 0, 
            change: await getPercentageChange('sermons', 'created_at'),
            published, 
            drafts,
            icon: MusicalNoteIcon, 
            color: 'purple',
            link: '/admin/sermons'
          }
        }
      }

      if (visibleStats.includes('projects')) {
        const { count, error } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          const { count: active } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'in_progress')
          
          const { count: completed } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed')
          
          statsData.projects = { 
            total: count || 0, 
            change: await getPercentageChange('projects', 'created_at'),
            active, 
            completed,
            icon: FolderIcon, 
            color: 'orange',
            link: '/admin/projects'
          }
        }
      }

      if (visibleStats.includes('events')) {
        const { count, error } = await supabase
          .from('service_programs')
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          const today = new Date().toISOString().split('T')[0]
          const { count: upcoming } = await supabase
            .from('service_programs')
            .select('*', { count: 'exact', head: true })
            .gte('service_date', today)
          
          statsData.events = { 
            total: count || 0, 
            change: await getPercentageChange('service_programs', 'created_at'),
            upcoming, 
            icon: CalendarIcon, 
            color: 'pink',
            link: '/admin/service-program'
          }
        }
      }

      if (visibleStats.includes('ministries')) {
        const { count, error } = await supabase
          .from('ministries')
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          const { count: active } = await supabase
            .from('ministries')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
          
          statsData.ministries = { 
            total: count || 0, 
            change: await getPercentageChange('ministries', 'created_at'),
            active,
            icon: UserGroupIcon, 
            color: 'teal',
            link: '/admin/ministries'
          }
        }
      }

      if (visibleStats.includes('registrations')) {
        const { count, error } = await supabase
          .from('ministry_registrations')
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          const { count: pending } = await supabase
            .from('ministry_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
          
          statsData.registrations = { 
            total: count || 0, 
            change: await getPercentageChange('ministry_registrations', 'created_at'),
            pending, 
            icon: ClipboardDocumentListIcon, 
            color: 'yellow',
            link: '/admin/registrations'
          }
        }
      }

      if (visibleStats.includes('choir')) {
        const { count, error } = await supabase
          .from('choir_members')
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          const { count: active } = await supabase
            .from('choir_members')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
          
          statsData.choir = { 
            total: count || 0, 
            change: await getPercentageChange('choir_members', 'created_at'),
            active,
            icon: TrophyIcon, 
            color: 'pink',
            link: '/admin/choir-history'
          }
        }
      }

      if (visibleStats.includes('hymns')) {
        const { count, error } = await supabase
          .from('hymn_books')
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          statsData.hymns = { 
            total: count || 0, 
            change: await getPercentageChange('hymn_books', 'created_at'),
            icon: BookOpenIcon, 
            color: 'emerald',
            link: '/admin/hymn-books'
          }
        }
      }

      if (visibleStats.includes('finances')) {
        // Fetch real financial data
        const { data: incomeData, error: incomeError } = await supabase
          .from('financial_transactions')
          .select('amount')
          .eq('type', 'income')
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
        
        const { data: expenseData, error: expenseError } = await supabase
          .from('financial_transactions')
          .select('amount')
          .eq('type', 'expense')
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
        
        if (!incomeError && !expenseError) {
          const income = incomeData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
          const expenses = expenseData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
          
          statsData.finances = { 
            income, 
            expenses, 
            balance: income - expenses,
            icon: CurrencyDollarIcon, 
            color: 'emerald',
            link: '/admin/financials'
          }
        }
      }

      // Fetch recent activity (last 10 actions across all tables)
      const activity = await fetchRecentActivity(visibleStats)
      setRecentActivity(activity)

      setStats(statsData)
      setLastUpdated(new Date())

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPercentageChange = async (table, dateColumn) => {
    try {
      const now = new Date()
      const lastMonth = new Date(now.setMonth(now.getMonth() - 1))
      
      const { count: currentCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .gte(dateColumn, lastMonth.toISOString())
      
      const previousMonth = new Date(now.setMonth(now.getMonth() - 2))
      const { count: previousCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .gte(dateColumn, previousMonth.toISOString())
        .lt(dateColumn, lastMonth.toISOString())
      
      if (previousCount === 0) return 100
      return Math.round(((currentCount - previousCount) / previousCount) * 100)
    } catch (error) {
      return 0
    }
  }

  const fetchRecentActivity = async (visibleStats) => {
    const activities = []
    
    // Fetch recent registrations
    if (visibleStats.includes('registrations')) {
      const { data } = await supabase
        .from('ministry_registrations')
        .select(`
          id,
          first_name,
          last_name,
          status,
          created_at,
          ministry:ministry_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (data) {
        data.forEach(item => {
          activities.push({
            id: `reg-${item.id}`,
            user: `${item.first_name} ${item.last_name}`,
            action: item.status === 'pending' ? 'registered for' : `registration ${item.status} for`,
            target: item.ministry?.name || 'a ministry',
            time: formatTimeAgo(item.created_at),
            type: 'registration',
            status: item.status
          })
        })
      }
    }

    // Fetch recent news
    if (visibleStats.includes('news')) {
      const { data } = await supabase
        .from('news')
        .select(`
          id,
          title,
          author_name,
          is_published,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (data) {
        data.forEach(item => {
          activities.push({
            id: `news-${item.id}`,
            user: item.author_name || 'Someone',
            action: item.is_published ? 'published news:' : 'created draft:',
            target: item.title,
            time: formatTimeAgo(item.created_at),
            type: 'news',
            status: item.is_published ? 'success' : 'draft'
          })
        })
      }
    }

    // Fetch recent sermons
    if (visibleStats.includes('sermons')) {
      const { data } = await supabase
        .from('sermons')
        .select(`
          id,
          title,
          speaker,
          is_published,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (data) {
        data.forEach(item => {
          activities.push({
            id: `sermon-${item.id}`,
            user: item.speaker || 'Someone',
            action: item.is_published ? 'published sermon:' : 'added sermon:',
            target: item.title,
            time: formatTimeAgo(item.created_at),
            type: 'sermon',
            status: item.is_published ? 'success' : 'draft'
          })
        })
      }
    }

    // Sort by time and return unique
    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10)
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInSeconds = Math.floor((now - past) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return past.toLocaleDateString()
  }

  const getRoleGreeting = () => {
    const greetings = {
      super_admin: 'You have full control over the church management system.',
      dean: 'You have oversight of all church operations.',
      admin: 'You can manage content and users.',
      media_admin: 'You can manage sermons, news, and media content.',
      finance_admin: 'You can track and manage church finances.',
      ministry_leader: 'You can manage your ministry and registrations.',
      secretary: 'You can manage service programs and events.',
      project_manager: 'You can track church projects.',
      choir_leader: 'You can manage choir members and performances.',
    }
    return greetings[adminRole?.role] || 'Welcome to your dashboard.'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <ShieldCheckIcon className="h-8 w-8 text-indigo-200" />
              <h1 className="text-2xl font-bold">
                Welcome back, {adminProfile?.full_name || adminUser?.email?.split('@')[0] || 'Admin'}! 👋
              </h1>
            </div>
            <p className="text-indigo-100 max-w-2xl">
              {getRoleGreeting()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-indigo-200">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <button
              onClick={fetchDashboardData}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Refresh data"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(stats).map(([key, stat]) => {
          const Icon = stat.icon
          const colorClasses = {
            indigo: 'bg-indigo-100 text-indigo-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
            pink: 'bg-pink-100 text-pink-600',
            teal: 'bg-teal-100 text-teal-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            emerald: 'bg-emerald-100 text-emerald-600',
          }

          return (
            <Link
              key={key}
              to={stat.link || '#'}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                {stat.change !== undefined && (
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    stat.change >= 0 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-red-600 bg-red-50'
                  }`}>
                    {stat.change >= 0 ? '+' : ''}{stat.change}%
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {typeof stat.total === 'number' ? stat.total.toLocaleString() : stat.total}
              </h3>
              <p className="text-sm text-gray-500 capitalize">{key}</p>
              
              {/* Additional stats */}
              {stat.published !== undefined && (
                <div className="mt-2 flex items-center space-x-2 text-xs">
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {stat.published} Published
                  </span>
                  {stat.drafts > 0 && (
                    <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                      {stat.drafts} Drafts
                    </span>
                  )}
                </div>
              )}
              
              {stat.active !== undefined && (
                <div className="mt-2 text-xs">
                  <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {stat.active} Active
                  </span>
                </div>
              )}
              
              {stat.pending > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-yellow-600 font-medium flex items-center">
                    {stat.pending} pending review
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </span>
                </div>
              )}
              
              {key === 'finances' && (
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Income</span>
                    <span className="font-medium text-green-600">
                      KSH {stat.income.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expenses</span>
                    <span className="font-medium text-red-600">
                      KSH {stat.expenses.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-100">
                    <span className="text-gray-700 font-medium">Balance</span>
                    <span className={`font-bold ${
                      stat.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      KSH {Math.abs(stat.balance).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  activity.type === 'sermon' ? 'bg-purple-100 text-purple-600' :
                  activity.type === 'news' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'finance' ? 'bg-green-100 text-green-600' :
                  activity.type === 'registration' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.type === 'sermon' && <MusicalNoteIcon className="h-4 w-4" />}
                  {activity.type === 'news' && <NewspaperIcon className="h-4 w-4" />}
                  {activity.type === 'finance' && <CurrencyDollarIcon className="h-4 w-4" />}
                  {activity.type === 'registration' && <ClipboardDocumentListIcon className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">{activity.target}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard