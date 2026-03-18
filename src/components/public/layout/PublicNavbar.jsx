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
  // ChurchIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { 
    name: 'Home', 
    href: '/', 
    icon: HomeIcon,
    description: 'Welcome to our church'
  },
  { 
    name: 'About', 
    href: '/about', 
    icon: HeartIcon,
    description: 'Our story & beliefs'
  },
  { 
    name: 'Ministries', 
    href: '/ministries', 
    icon: UserGroupIcon,
    description: 'Get involved'
  },
  { 
    name: 'Sermons', 
    href: '/sermons', 
    icon: MusicalNoteIcon,
    description: 'Listen to messages'
  },
  { 
    name: 'Services', 
    href: '/services', 
    icon: CalendarIcon,
    description: 'Join us worship'
  },
  { 
    name: 'News', 
    href: '/news', 
    icon: NewspaperIcon,
    description: 'Latest updates'
  },
  { 
    name: 'Hymns', 
    href: '/hymns', 
    icon: BookOpenIcon,
    description: 'Worship in song'
  },
  { 
    name: 'Projects', 
    href: '/projects', 
    icon: FolderIcon,
    description: 'Church initiatives'
  },
  { 
    name: 'Choir', 
    href: '/choir', 
    icon: MusicalNoteIcon,
    description: 'Our music ministry'
  },
  { 
    name: 'Contact', 
    href: '/contact', 
    icon: EnvelopeIcon,
    description: 'Get in touch'
  },
]

const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Secret admin access - triple click on logo
  const [clickCount, setClickCount] = useState(0)
  const [lastClick, setLastClick] = useState(0)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
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

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' 
          : 'bg-linear-to-r from-indigo-900/90 to-purple-900/90 backdrop-blur-sm py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center space-x-3 group">
            <button 
              onClick={handleLogoClick} 
              className="focus:outline-none transform transition-transform hover:scale-110 active:scale-95"
              title="Click 3 times for admin access"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                scrolled 
                  ? 'bg-linear-to-br from-indigo-600 to-purple-600 group-hover:shadow-indigo-200' 
                  : 'bg-white/20 backdrop-blur-md group-hover:bg-white/30'
              }`}>
                <span className="text-white font-bold text-2xl transform group-hover:rotate-12 transition-transform">⛪</span>
              </div>
            </button>
            <div className="flex flex-col">
              <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
                scrolled ? 'text-gray-900' : 'text-white'
              }`}>
                Grace Church
              </span>
              <span className={`text-xs tracking-wider transition-colors duration-300 ${
                scrolled ? 'text-gray-500' : 'text-indigo-200'
              }`}>
                WELCOME HOME
              </span>
            </div>
          </div>

          {/* Desktop menu - Center */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    scrolled
                      ? isActive
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50'
                      : isActive
                        ? 'text-white bg-white/20'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                    }`} />
                    <span>{item.name}</span>
                  </div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -bottom-12 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                      {item.description}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Right section - CTA Button */}
          <div className="hidden lg:block">
            <Link
              to="/services"
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                scrolled
                  ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-white text-indigo-900 hover:bg-indigo-50'
              }`}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Join Us
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-300 ${
                scrolled
                  ? 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - Enhanced */}
      <div 
        className={`lg:hidden transition-all duration-500 ease-in-out transform ${
          mobileMenuOpen 
            ? 'max-h-screen opacity-100 translate-y-0' 
            : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'
        } overflow-hidden`}
      >
        <div className={`px-4 pt-2 pb-4 space-y-2 ${
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
                className={`group flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                  scrolled
                    ? isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                    : isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs ${
                      scrolled ? 'text-gray-500' : 'text-indigo-200'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </div>
                <ChevronDownIcon className={`h-4 w-4 transform -rotate-90 transition-transform group-hover:translate-x-1 ${
                  scrolled ? 'text-gray-400' : 'text-white/60'
                }`} />
              </Link>
            )
          })}
          
          {/* Mobile CTA */}
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className={`mt-4 block text-center px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              scrolled
                ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-indigo-900'
            }`}
          >
            <CalendarIcon className="h-5 w-5 inline mr-2" />
            Join Us This Sunday
          </Link>
        </div>
      </div>

      {/* Progress bar - subtle decorative element */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-indigo-400 to-transparent opacity-50"></div>
    </nav>
  )
}

export default PublicNavbar