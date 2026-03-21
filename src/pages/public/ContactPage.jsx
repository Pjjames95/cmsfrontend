import React, { useState } from 'react'
import { 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      toast.success('Message sent successfully! We\'ll get back to you soon.')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
      setSubmitting(false)
    }, 1500)
  }

  const contactInfo = [
    {
      icon: MapPinIcon,
      title: 'Visit Us',
      details: ['Church Street', 'Nairobi, Kenya', 'PO Box 12345-5678']
    },
    {
      icon: PhoneIcon,
      title: 'Call Us',
      details: ['+254 789 249 656', '+254 794 975 348']
    },
    {
      icon: EnvelopeIcon,
      title: 'Email Us',
      details: ['gachombajames7@gmail.com', 'support@gracechurch.org']
    },
    {
      icon: ClockIcon,
      title: 'Service Times',
      details: ['Sunday: 9:00 AM & 11:00 AM', 'Wednesday: 7:00 PM', 'Saturday: 8:00 AM']
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl max-w-3xl">
            We'd love to hear from you! Whether you have questions, prayer requests, 
            or just want to connect, our team is here for you.
          </p>
        </div>
      </div>

      {/* Contact Information Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              {item.details.map((detail, i) => (
                <p key={i} className="text-gray-600">{detail}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Map and Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Map */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Us</h2>
            <div className="bg-gray-200 h-96 rounded-lg flex items-center">
              {/* <span className="text-gray-500"> */}
                <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15958.111304828482!2d34.783232!3d-0.6914048!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ske!4v1765284482292!5m2!1sen!2ske" 
                width="100%" height="100%" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
              {/* </span> */}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Message *
                </label>
                <textarea
                  name="message"
                  rows={5}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What time are your services?</h3>
              <p className="text-gray-600 mb-4">
                We have services every Sunday at 9:00 AM and 11:00 AM, Wednesday Bible study at 7:00 PM, 
                and Saturday prayer meeting at 8:00 AM.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there parking available?</h3>
              <p className="text-gray-600 mb-4">
                Yes, we have ample parking available on our church grounds with designated areas for visitors.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What should I wear?</h3>
              <p className="text-gray-600 mb-4">
                Come as you are! You'll find people dressed in everything from casual to formal attire.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you have programs for children?</h3>
              <p className="text-gray-600 mb-4">
                Yes, we have vibrant children's ministry during all our services with age-appropriate activities.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How can I get involved?</h3>
              <p className="text-gray-600 mb-4">
                Visit our Ministries page to learn about different serving opportunities, or fill out our contact form.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is the building accessible?</h3>
              <p className="text-gray-600 mb-4">
                Yes, our facility is wheelchair accessible with ramps and designated seating areas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage