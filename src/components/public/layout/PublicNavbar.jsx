import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Bars3Icon, 
  XMarkIcon,
  ChevronDownIcon,
  HomeIcon,
  UserGroupIcon,
  MusicalNoteIcon,
  CalendarIcon,
  NewspaperIcon,
  BookOpenIcon,
  FolderIcon,
  HeartIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'About', href: '/about', icon: HeartIcon },
  { name: 'Ministries', href: '/ministries', icon: UserGroupIcon },
  { name: 'Sermons', href: '/sermons', icon: MusicalNoteIcon },
  { name: 'Services', href: '/services', icon: CalendarIcon },
  { name: 'News', href: '/news', icon: NewspaperIcon },
  { name: 'Hymns', href: '/hymns', icon: BookOpenIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Choir', href: '/choir', icon: MusicalNoteIcon },
  { name: 'Contact', href: '/contact', icon: EnvelopeIcon },
]

const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Secret admin access - triple click on logo
  const [clickCount, setClickCount] = useState(0)
  const [lastClick, setLastClick] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogoClick = () => {
    const now = Date.now()
    if (now - lastClick < 500) {
      const newCount = clickCount + 1
      setClickCount(newCount)
      if (newCount === 3) {
        navigate('/admin/login')
        setClickCount(0)
      }
    } else {
      setClickCount(1)
    }
    setLastClick(now)
  }

  // Split navigation into left and right sections
  const midpoint = Math.ceil(navigation.length / 2)
  const leftNav = navigation.slice(0, midpoint)
  const rightNav = navigation.slice(midpoint)

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' 
        : 'bg-linear-to-r from-indigo-900/95 to-purple-900/95 backdrop-blur-sm py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleLogoClick} 
              className="focus:outline-none transform transition-transform hover:scale-110 active:scale-95"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg ${
                scrolled 
                  ? 'bg-linear-to-br from-indigo-600 to-purple-600' 
                  : 'bg-white/20 backdrop-blur-md'
              }`}>
                <span className="text-white font-bold text-xl">⛪</span>
              </div>
            </button>
            <span className={`text-xl font-bold tracking-tight ${
              scrolled ? 'text-gray-900' : 'text-white'
            }`}>
              Grace Church
            </span>
          </div>

          {/* Desktop Navigation - Centered and Spread Out */}
          <div className="hidden lg:flex lg:items-center lg:justify-center lg:flex-1 lg:space-x-1">
            {/* Left navigation items */}
            {leftNav.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-1 ${
                    scrolled
                      ? isActive
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50'
                      : isActive
                        ? 'text-white bg-white/20'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* Right navigation items */}
            {rightNav.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-1 ${
                    scrolled
                      ? isActive
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50'
                      : isActive
                        ? 'text-white bg-white/20'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-2 rounded-lg transition-colors ${
                scrolled 
                  ? 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            <Link
              to="/contact"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                scrolled
                  ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                  : 'bg-white text-indigo-900 hover:bg-indigo-50'
              }`}
            >
              <UserCircleIcon className="h-4 w-4" />
              <span>Visit Us</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled
                ? 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
                : 'text-white hover:bg-white/20'
            }`}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Search bar (expands when search is clicked) */}
        
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden transition-all duration-500 ease-in-out transform ${
        mobileMenuOpen 
          ? 'max-h-screen opacity-100 translate-y-0' 
          : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'
      } overflow-hidden`}>
        <div className={`px-4 pt-2 pb-4 space-y-1 ${
          scrolled ? 'bg-white' : 'bg-linear-to-b from-indigo-900 to-purple-900'
        }`}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  scrolled
                    ? isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                    : isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default PublicNavbar