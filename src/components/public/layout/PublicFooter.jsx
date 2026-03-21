import React from 'react'
import { Link } from 'react-router-dom'

const PublicFooter = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Grace Church</h3>
            <p className="text-gray-400 text-sm">
              A place of worship, community, and spiritual growth. Join us as we journey together in faith.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/ministries" className="text-gray-400 hover:text-white transition-colors">
                  Ministries
                </Link>
              </li>
              <li>
                <Link to="/sermons" className="text-gray-400 hover:text-white transition-colors">
                  Sermons
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Service Times */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Service Times</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Sunday Worship: 9:00 AM & 11:00 AM</li>
              <li>Wednesday Bible Study: 7:00 PM</li>
              <li>Saturday Prayer: 8:00 AM</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-400">
              <li>123 Church Street</li>
              <li>City, State 12345</li>
              <li>Phone: (555) 123-4567</li>
              <li>Email: info@gracechurch.org</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Grace Church. All rights reserved.</p>
          <p>Designed and developed by Gtech Labs</p>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter