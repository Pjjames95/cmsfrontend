import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import {
  HomeIcon,
  UserGroupIcon,
  NewspaperIcon,
  MusicalNoteIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  FolderIcon,
  UsersIcon,
  ClockIcon,
  TrophyIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline'

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) => {
  const { adminRole, signOut } = useAdminAuth()
  const navigate = useNavigate()

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: HomeIcon, 
      roles: ['dean', 'admin', 'media_admin', 'financials_admin', 'ministries_admin', 'secretary_admin', 'projects_admin', 'choir_admin'],
      color: 'from-indigo-500 to-indigo-600',
      bgLight: 'bg-indigo-50',
      count: null
    },
    { 
      name: 'Roles', 
      href: '/admin/roles', 
      icon: UsersIcon, 
      roles: ['dean'],
      color: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      count: null
    },
    { 
      name: 'Ministries', 
      href: '/admin/ministries', 
      icon: UserGroupIcon, 
      roles: ['admin', 'ministries_admin', 'dean'],
      color: 'from-green-500 to-green-600',
      bgLight: 'bg-green-50',
      count: null
    },
    { 
      name: 'News', 
      href: '/admin/news', 
      icon: NewspaperIcon, 
      roles: ['admin', 'media_admin'],
      color: 'from-yellow-500 to-yellow-600',
      bgLight: 'bg-yellow-50',
      count: null
    },
    { 
      name: 'Sermons', 
      href: '/admin/sermons', 
      icon: MusicalNoteIcon, 
      roles: ['super_admin', 'media_admin'],
      color: 'from-red-500 to-red-600',
      bgLight: 'bg-red-50',
      count: null
    },
    { 
      name: 'Hymn Books', 
      href: '/admin/hymn-books', 
      icon: BookOpenIcon, 
      roles: ['admin', 'secretary_admin'],
      color: 'from-orange-500 to-orange-600',
      bgLight: 'bg-orange-50',
      count: null
    },
    { 
      name: 'Financials', 
      href: '/admin/financials', 
      icon: CurrencyDollarIcon, 
      roles: ['admin', 'financials_admin', 'dean'],
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      count: null
    },
    { 
      name: 'Service Program', 
      href: '/admin/service-program', 
      icon: CalendarIcon, 
      roles: ['admin', 'secretary_admin'],
      color: 'from-cyan-500 to-cyan-600',
      bgLight: 'bg-cyan-50',
      count: null
    },
    { 
      name: 'Projects', 
      href: '/admin/projects', 
      icon: FolderIcon, 
      roles: ['admin', 'projects_admin'],
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      count: null
    },
    { 
      name: 'Choir History', 
      href: '/admin/choir-history', 
      icon: TrophyIcon, 
      roles: ['admin', 'choir_admin'],
      color: 'from-pink-500 to-pink-600',
      bgLight: 'bg-pink-50',
      count: null
    },
    { 
      name: 'Registrations', 
      href: '/admin/registrations', 
      icon: ClipboardDocumentListIcon, 
      roles: ['admin', 'ministries_admin'],
      color: 'from-teal-500 to-teal-600',
      bgLight: 'bg-teal-50',
      count: 3 
    },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(adminRole?.role)
  )

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button onClick={() => setSidebarOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="sr-only">Close sidebar</span>
              <span className="text-white text-2xl">×</span>
            </button>
          </div>
          
          <MobileSidebarContent 
            navigation={filteredNavigation} 
            adminRole={adminRole}
            onSignOut={handleSignOut}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:shrink-0 fixed left-0 top-0 h-full transition-all duration-300 z-30 ${
  collapsed ? 'w-20' : 'w-72'
}`}>
  <div className="flex flex-col w-full h-full bg-linear-to-b from-gray-900 to-gray-800 rounded-r-2xl shadow-2xl">
    <DesktopSidebarContent 
      navigation={filteredNavigation} 
      adminRole={adminRole}
      collapsed={collapsed}
      onSignOut={handleSignOut}
    />
    
    {/* Collapse toggle button */}
    <button
      onClick={() => setCollapsed(!collapsed)}
      className="absolute -right-3 top-20 bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 z-40"
    >
      {collapsed ? (
        <ChevronRightIcon className="h-4 w-4" />
      ) : (
        <ChevronLeftIcon className="h-4 w-4" />
      )}
    </button>
  </div>
</div>
    </>
  )
}

// Mobile Sidebar Content
const MobileSidebarContent = ({ navigation, adminRole, onSignOut, onClose }) => (
  <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto bg-linear-to-b from-gray-900 to-gray-800">
    <div className="shrink-0 flex items-center px-4 mb-6">
      <div className="h-10 w-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <ShieldCheckIcon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-3">
        <h1 className="text-lg font-bold text-white">Admin Panel</h1>
        <p className="text-xs text-indigo-300 capitalize">{adminRole?.role?.replace('_', ' ') || 'Administrator'}</p>
      </div>
    </div>
    
    <nav className="mt-5 px-2 space-y-1">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          onClick={onClose}
          className={({ isActive }) => 
            `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              isActive 
                ? `bg-linear-to-r ${item.color} text-white shadow-lg` 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`
          }
        >
          <item.icon className={`h-5 w-5 mr-3 ${item.bgLight}`} />
          <span className="flex-1">{item.name}</span>
          {item.count && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {item.count}
            </span>
          )}
        </NavLink>
      ))}
      
      <button
        onClick={onSignOut}
        className="w-full group flex items-center px-3 py-3 text-sm font-medium rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 mt-4"
      >
        <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
        Sign Out
      </button>
    </nav>
  </div>
)

// Desktop Sidebar Content
const DesktopSidebarContent = ({ navigation, adminRole, collapsed, onSignOut }) => (
  <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
    {/* Logo area */}
    <div className={`flex items-center px-4 mb-8 ${collapsed ? 'justify-center' : ''}`}>
      <div className={`h-12 w-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform`}>
        <ShieldCheckIcon className="h-7 w-7 text-white" />
      </div>
      {!collapsed && (
        <div className="ml-3">
          <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          <p className="text-xs text-indigo-300 capitalize">{adminRole?.role?.replace('_', ' ') || 'Administrator'}</p>
        </div>
      )}
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-3 space-y-1">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) => 
            `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              collapsed ? 'justify-center' : ''
            } ${
              isActive 
                ? `bg-linear-to-r ${item.color} text-white shadow-lg` 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`
          }
          title={collapsed ? item.name : ''}
        >
          <item.icon className={`h-5 w-5 ${!collapsed && 'mr-3'} ${item.bgLight}`} />
          {!collapsed && (
            <>
              <span className="flex-1">{item.name}</span>
              {item.count && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
            </>
          )}
          {collapsed && item.count && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {item.count}
            </span>
          )}
        </NavLink>
      ))}
    </nav>

    {/* Bottom section */}
    <div className="mt-auto px-3 pt-4">
      {!collapsed && (
        <div className="mb-4 px-3 py-3 bg-gray-800/50 rounded-xl">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-xs text-gray-400">Storage</p>
              <p className="text-sm text-white">45% used</p>
            </div>
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={onSignOut}
        className={`w-full group flex items-center px-3 py-3 text-sm font-medium rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 ${
          collapsed ? 'justify-center' : ''
        }`}
        title={collapsed ? 'Sign Out' : ''}
      >
        <ArrowLeftOnRectangleIcon className={`h-5 w-5 ${!collapsed && 'mr-3'}`} />
        {!collapsed && 'Sign Out'}
      </button>
    </div>
  </div>
)

export default AdminSidebar