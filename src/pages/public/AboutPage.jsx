import React from 'react'
import { Link } from 'react-router-dom'
import churchLogo from '../assets/church.jpg'
import { 
  HeartIcon,
  UserGroupIcon,
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const AboutPage = () => {
  const values = [
    {
      title: 'Faith',
      description: 'We believe in the power of faith to transform lives and communities.',
      icon: HeartIcon
    },
    {
      title: 'Community',
      description: 'We are committed to building a strong, supportive community of believers.',
      icon: UserGroupIcon
    },
    {
      title: 'Service',
      description: 'We serve others as an expression of God\'s love for all humanity.',
      icon: HeartIcon
    },
    {
      title: 'Growth',
      description: 'We encourage spiritual growth through teaching, fellowship, and prayer.',
      icon: CheckCircleIcon
    }
  ]

  const leadership = [
    {
      name: 'Pastor John Smith',
      role: 'Senior Pastor',
      bio: 'Leading our congregation since 2015 with a passion for teaching and community outreach.',
      image: null
    },
    {
      name: 'Pastor Mary Johnson',
      role: 'Associate Pastor',
      bio: 'Dedicated to discipleship and pastoral care, helping members grow in their faith journey.',
      image: null
    },
    {
      name: 'David Williams',
      role: 'Worship Director',
      bio: 'Leading our worship ministry with a heart for creative and spirit-led worship experiences.',
      image: null
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Our Church</h1>
          <p className="text-xl max-w-3xl">
            We are a community of believers dedicated to loving God, loving others, 
            and making disciples of Jesus Christ.
          </p>
        </div>
      </div>

      {/* Our Story */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Founded in 1985, Grace Church began as a small gathering of families 
              meeting in a living room. Over the years, we've grown into a vibrant 
              community of believers from all walks of life.
            </p>
            <p className="text-gray-600 mb-4">
              Our mission remains the same: to create a welcoming place where people 
              can encounter God, find belonging, and discover their purpose. We believe 
              that church is not just a Sunday gathering, but a family on mission together.
            </p>
            <p className="text-gray-600">
              Today, we're blessed to have multiple ministries serving our local community 
              and beyond, from children and youth programs to community outreach and 
              international missions.
            </p>
          </div>
          <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center overflow-hidden">
          <img 
            src="/images/church.jpg" 
            alt="Church Building" 
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              console.error('Image failed to load:', e.target.src)
              e.target.onerror = null
              e.target.style.display = 'none'
              // Show fallback
              const parent = e.target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full bg-linear-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                    <div class="text-center text-white">
                      <span class="text-6xl mb-4 block">⛪</span>
                      <p class="text-xl font-semibold">Grace Church</p>
                    </div>
                  </div>
                `
              }
            }}
          />
        </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                  <value.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leadership */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Leadership</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leadership.map((leader, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-64 bg-gray-200 flex items-center justify-center">
                <UserGroupIcon className="h-16 w-16 text-gray-400" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{leader.name}</h3>
                <p className="text-indigo-600 mb-3">{leader.role}</p>
                <p className="text-gray-600">{leader.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Beliefs */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What We Believe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Faith</h3>
              <p className="text-gray-600">
                We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit. 
                We believe in the deity of Jesus Christ, His virgin birth, sinless life, miracles, 
                vicarious and atoning death, bodily resurrection, and ascension to the right hand of the Father.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">The Bible</h3>
              <p className="text-gray-600">
                We believe the Bible is the inspired, infallible, and authoritative Word of God. 
                It is our guide for faith, doctrine, and daily living.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Salvation</h3>
              <p className="text-gray-600">
                We believe salvation is a gift of God through faith in Jesus Christ. 
                It is not earned by works but received by grace.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">The Church</h3>
              <p className="text-gray-600">
                We believe the church is the body of Christ, called to worship God, 
                build up believers, and reach the lost with the gospel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Us This Sunday</h2>
          <p className="text-xl mb-8">Experience the warmth of our community and the power of worship.</p>
          <Link
            to="/services"
            className="inline-flex items-center px-6 py-3 border-2 border-white text-lg font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 transition-colors"
          >
            View Service Times
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AboutPage