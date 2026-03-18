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
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EllipsisHorizontalIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
)

const AdminDashboard = () => {
  const { adminRole, isSuperAdmin, adminUser, adminProfile } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    users: { total: 0, change: 0 },
    news: { total: 0, change: 0, published: 0, drafts: 0 },
    sermons: { total: 0, change: 0, published: 0, drafts: 0 },
    projects: { total: 0, change: 0, active: 0, completed: 0 },
    events: { total: 0, change: 0, upcoming: 0 },
    ministries: { total: 0, change: 0, active: 0 },
    finances: { income: 0, expenses: 0, balance: 0 },
    registrations: { total: 0, pending: 0, approved: 0 }
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [selectedTimeframe, setSelectedTimeframe] = useState('week')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch real data from your tables
      const [
        usersRes,
        newsRes,
        sermonsRes,
        projectsRes,
        eventsRes,
        ministriesRes,
        registrationsRes
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('sermons').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('service_programs').select('*', { count: 'exact', head: true }),
        supabase.from('ministries').select('*', { count: 'exact', head: true }),
        supabase.from('ministry_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ])

      // Get published/draft counts for news
      const { count: publishedNews } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)

      const { count: draftNews } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', false)

      // Get published/draft counts for sermons
      const { count: publishedSermons } = await supabase
        .from('sermons')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)

      const { count: draftSermons } = await supabase
        .from('sermons')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', false)

      // Get active/completed projects
      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress')

      const { count: completedProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Get upcoming events
      const today = new Date().toISOString().split('T')[0]
      const { count: upcomingEvents } = await supabase
        .from('service_programs')
        .select('*', { count: 'exact', head: true })
        .gte('service_date', today)

      // Get active ministries
      const { count: activeMinistries } = await supabase
        .from('ministries')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Get total registrations
      const { count: totalRegistrations } = await supabase
        .from('ministry_registrations')
        .select('*', { count: 'exact', head: true })

      setStats({
        users: { total: usersRes.count || 0, change: 8 },
        news: { 
          total: newsRes.count || 0, 
          change: 2, 
          published: publishedNews || 0, 
          drafts: draftNews || 0 
        },
        sermons: { 
          total: sermonsRes.count || 0, 
          change: 5, 
          published: publishedSermons || 0, 
          drafts: draftSermons || 0 
        },
        projects: { 
          total: projectsRes.count || 0, 
          change: 3, 
          active: activeProjects || 0, 
          completed: completedProjects || 0 
        },
        events: { 
          total: eventsRes.count || 0, 
          change: 4, 
          upcoming: upcomingEvents || 0 
        },
        ministries: { 
          total: ministriesRes.count || 0, 
          change: 1, 
          active: activeMinistries || 0 
        },
        finances: {
          income: 45250,
          expenses: 32180,
          balance: 13070
        },
        registrations: {
          total: totalRegistrations || 0,
          pending: registrationsRes.count || 0,
          approved: 0
        }
      })

      // Generate recent activity (you'd fetch this from an activity log table)
      setRecentActivity([
        { 
          id: 1, 
          user: 'John Doe', 
          action: 'Created new sermon', 
          target: 'The Power of Faith',
          time: '5 minutes ago',
          type: 'sermon',
          status: 'success'
        },
        { 
          id: 2, 
          user: 'Jane Smith', 
          action: 'Updated financial report', 
          target: 'Q1 2024',
          time: '15 minutes ago',
          type: 'finance',
          status: 'warning'
        },
        { 
          id: 3, 
          user: 'Pastor Mike', 
          action: 'Published news article', 
          target: 'Easter Celebration',
          time: '1 hour ago',
          type: 'news',
          status: 'success'
        },
        { 
          id: 4, 
          user: 'Sarah Johnson', 
          action: 'Approved ministry registration', 
          target: 'Worship Team',
          time: '3 hours ago',
          type: 'registration',
          status: 'success'
        },
        { 
          id: 5, 
          user: 'David Williams', 
          action: 'Modified service program', 
          target: 'Sunday Service',
          time: '5 hours ago',
          type: 'service',
          status: 'info'
        },
        { 
          id: 6, 
          user: 'Mary Musyoki', 
          action: 'Added new member to choir', 
          target: 'Choir',
          time: '1 day ago',
          type: 'choir',
          status: 'success'
        },
      ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Chart data
  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Visitors',
        data: [65, 78, 52, 84, 96, 120, 145],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const doughnutData = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [stats.finances.income, stats.finances.expenses],
        backgroundColor: ['#10B981', '#EF4444'],
        borderColor: ['#059669', '#DC2626'],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: '#6B7280',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
      },
    },
  }

  const quickActions = [
    { name: 'Create News', href: '/admin/news', icon: NewspaperIcon, color: 'bg-blue-500' },
    { name: 'Add Sermon', href: '/admin/sermons', icon: MusicalNoteIcon, color: 'bg-green-500' },
    { name: 'Schedule Event', href: '/admin/service-program', icon: CalendarIcon, color: 'bg-purple-500' },
    { name: 'Update Ministry', href: '/admin/ministries', icon: UserGroupIcon, color: 'bg-orange-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-indigo-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Welcome back, {adminProfile?.full_name || adminUser?.email?.split('@')[0] || 'Admin'}! 👋
            </h1>
            <p className="text-indigo-100">
              {isSuperAdmin 
                ? 'You have super admin privileges. Here\'s what\'s happening with your church today.'
                : `You are logged in as ${adminRole?.role?.replace('_', ' ') || 'Administrator'}.`}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2">
            <ClockIcon className="h-5 w-5" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +{stats.users.change}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.users.total}</h3>
          <p className="text-sm text-gray-500">Total Users</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link to="/admin/roles" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
              Manage users
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* News Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <NewspaperIcon className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +{stats.news.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.news.total}</h3>
          <p className="text-sm text-gray-500">News Articles</p>
          <div className="mt-2 flex items-center space-x-2 text-xs">
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full">{stats.news.published} Published</span>
            <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">{stats.news.drafts} Drafts</span>
          </div>
        </div>

        {/* Sermons Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MusicalNoteIcon className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +{stats.sermons.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.sermons.total}</h3>
          <p className="text-sm text-gray-500">Sermons</p>
          <div className="mt-2 flex items-center space-x-2 text-xs">
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full">{stats.sermons.published} Published</span>
            <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">{stats.sermons.drafts} Drafts</span>
          </div>
        </div>

        {/* Projects Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FolderIcon className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +{stats.projects.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.projects.total}</h3>
          <p className="text-sm text-gray-500">Projects</p>
          <div className="mt-2 flex items-center space-x-2 text-xs">
            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{stats.projects.active} Active</span>
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full">{stats.projects.completed} Completed</span>
          </div>
        </div>

        {/* Events Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pink-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-pink-600" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +{stats.events.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.events.total}</h3>
          <p className="text-sm text-gray-500">Events</p>
          <div className="mt-2">
            <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full text-xs">{stats.events.upcoming} Upcoming</span>
          </div>
        </div>

        {/* Ministries Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-teal-600" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +{stats.ministries.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.ministries.total}</h3>
          <p className="text-sm text-gray-500">Ministries</p>
          <div className="mt-2">
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">{stats.ministries.active} Active</span>
          </div>
        </div>

        {/* Registrations Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600" />
            </div>
            {stats.registrations.pending > 0 && (
              <span className="text-sm font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                {stats.registrations.pending} Pending
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.registrations.total}</h3>
          <p className="text-sm text-gray-500">Registrations</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link to="/admin/registrations" className="text-sm text-yellow-600 hover:text-yellow-800 font-medium flex items-center">
              Review pending
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Financial Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              KSH {stats.finances.balance.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">Income</span>
            <span className="text-sm font-medium text-green-600">KSH {stats.finances.income.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Expenses</span>
            <span className="text-sm font-medium text-red-600">KSH {stats.finances.expenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Website Traffic</h2>
            <div className="flex items-center space-x-2">
              {['week', 'month', 'year'].map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTimeframe(time)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    selectedTimeframe === time
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {time.charAt(0).toUpperCase() + time.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
          <div className="h-48 mb-4">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Income</span>
              </div>
              <span className="text-sm font-medium text-gray-900">KSH {stats.finances.income.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Expenses</span>
              </div>
              <span className="text-sm font-medium text-gray-900">KSH {stats.finances.expenses.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">Balance</span>
              <span className={`text-sm font-bold ${stats.finances.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KSH {stats.finances.balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="group p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
              >
                <div className={`inline-flex p-3 rounded-lg ${action.color} text-white mb-2 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-gray-700">{action.name}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <button 
              onClick={fetchDashboardData}
              className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  activity.type === 'sermon' ? 'bg-purple-100 text-purple-600' :
                  activity.type === 'finance' ? 'bg-green-100 text-green-600' :
                  activity.type === 'news' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'registration' ? 'bg-yellow-100 text-yellow-600' :
                  activity.type === 'service' ? 'bg-indigo-100 text-indigo-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.type === 'sermon' && <MusicalNoteIcon className="h-4 w-4" />}
                  {activity.type === 'finance' && <CurrencyDollarIcon className="h-4 w-4" />}
                  {activity.type === 'news' && <NewspaperIcon className="h-4 w-4" />}
                  {activity.type === 'registration' && <ClipboardDocumentListIcon className="h-4 w-4" />}
                  {activity.type === 'service' && <CalendarIcon className="h-4 w-4" />}
                  {activity.type === 'choir' && <TrophyIcon className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user} <span className="text-gray-500">•</span> {activity.action}
                    </p>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{activity.target}</p>
                </div>
                {activity.status === 'success' && (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                )}
                {activity.status === 'warning' && (
                  <XCircleIcon className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Database</span>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-auto">Operational</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Storage</span>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-auto">Operational</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Authentication</span>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-auto">Operational</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard