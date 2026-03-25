import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { publicAPI } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import { validateMinistryRegistration } from '../../utils/validation'
import FormError from '../../components/common/FormError'
import { 
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  AcademicCapIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

const MinistryRegistrationPage = () => {
  const { ministryId } = useParams()
  const navigate = useNavigate()
  
  const [ministry, setMinistry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1) // 1: form, 2: confirmation, 3: success
  const [existingRegistration, setExistingRegistration] = useState(null)
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    skills: [],
    availability: [],
    previous_experience: '',
    motivation: '',
    heard_from: '',
    newsletter: false
  })

  const [newSkill, setNewSkill] = useState('')
  const [newAvailability, setNewAvailability] = useState('')

  const skillOptions = [
    'Singing', 'Playing Instrument', 'Teaching', 'Leadership', 
    'Event Planning', 'Technical/Audio', 'Video Production', 
    'Social Media', 'Writing', 'Counseling', 'Prayer', 
    'Hospitality', 'Children/Youth Work', 'Administration'
  ]

  const availabilityOptions = [
    'Sunday Mornings', 'Sunday Evenings', 'Wednesday Evenings',
    'Saturday Mornings', 'Weekday Evenings', 'Weekend Availability',
    'Flexible Schedule'
  ]

  useEffect(() => {
    if (ministryId) {
      fetchMinistry()
    }
  }, [ministryId])

  const fetchMinistry = async () => {
    try {
      const { data, error } = await publicAPI.getMinistryById(ministryId)
      if (error) throw error
      setMinistry(data)
    } catch (error) {
      console.error('Error fetching ministry:', error)
      toast.error('Failed to load ministry information')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAddSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const handleAddAvailability = () => {
    if (newAvailability && !formData.availability.includes(newAvailability)) {
      setFormData(prev => ({
        ...prev,
        availability: [...prev.availability, newAvailability]
      }))
      setNewAvailability('')
    }
  }

  const handleRemoveAvailability = (time) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.filter(t => t !== time)
    }))
  }

  const handleCheckExisting = async () => {
      if (!lookupEmail) {
        toast.error('Please enter your email')
        return
      }

      setLookingUp(true)
      try {
        // Use a simpler query that's less likely to timeout
        const { data, error } = await supabase
          .from('ministry_registrations')
          .select(`
            id,
            status,
            registration_date,
            ministry:ministry_id (
              name
            )
          `)
          .eq('email', lookupEmail)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data && data.length > 0) {
          setExistingRegistration(data)
          toast.success(`Found ${data.length} registration(s)`)
        } else {
          toast.error('No registrations found with this email')
          setExistingRegistration(null)
        }
      } catch (error) {
        console.error('Error checking registrations:', error)
        toast.error('Failed to check registrations. Please try again.')
      } finally {
        setLookingUp(false)
      }
    }

  const handleSubmit = async (e) => {
  e.preventDefault()

  const validationErrors = validateMinistryRegistration(formData)
  setErrors(validationErrors)
  
  if (Object.keys(validationErrors).length > 0) {
    toast.error('Please fix the errors before submitting')
    return
  }

  setSubmitting(true)

  try {
    const registrationData = {
      ministry_id: ministryId,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone || null,
      date_of_birth: formData.date_of_birth || null,
      address: formData.address || null,
      emergency_contact_name: formData.emergency_contact_name || null,
      emergency_contact_phone: formData.emergency_contact_phone || null,
      skills: formData.skills,
      availability: formData.availability,
      previous_experience: formData.previous_experience || null,
      motivation: formData.motivation || null,
      status: 'pending',
      registration_date: new Date().toISOString()
    }

    console.log('Submitting registration:', registrationData)

    // Use the publicAPI method instead of direct supabase call
    const { data, error } = await publicAPI.submitMinistryRegistration(registrationData)

    if (error) {
      console.error('Insert error:', error)
      
      if (error.code === '42501') {
        toast.error('Unable to submit registration due to permission issues. Please contact the church administrator.')
      } else if (error.code === '23505') {
        toast.error('You have already registered for this ministry.')
        setStep(2)
      } else {
        toast.error('Failed to submit registration. Please try again.')
      }
      return
    }

    console.log('Registration successful:', data)
    setStep(3)
    toast.success('Registration submitted successfully!')

  } catch (error) {
    console.error('Error submitting registration:', error)
    toast.error('Failed to submit registration. Please try again.')
  } finally {
    setSubmitting(false)
  }
}

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIconSolid className="h-3 w-3 mr-1" />
          Approved
        </span>
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Rejected
        </span>
      case 'waiting_list':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Waiting List
        </span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pending Review
        </span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading ministry information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!ministry) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Ministry Not Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The ministry you're looking for doesn't exist or is no longer active.
            </p>
            <Link
              to="/ministries"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Browse Ministries
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/ministries#${ministry.id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Ministry Details
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Join {ministry.name}
            </h1>
            <p className="text-lg text-gray-600">
              {ministry.description || 'Fill out the form below to express your interest in joining this ministry.'}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Registration Form</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Confirmation</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Step 1: Registration Form */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.first_name ? 'border-red-500' : ''
                      }`}
                    />
                    <FormError error={errors.first_name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Street address, city, postal code"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Skills & Interests</h3>
                
                {/* Skill Tags */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select your skills or areas of interest
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skillOptions.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          if (formData.skills.includes(skill)) {
                            handleRemoveSkill(skill)
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              skills: [...prev.skills, skill]
                            }))
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          formData.skills.includes(skill)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>

                  {/* Custom Skill Input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a custom skill"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Availability</h3>
                
                {/* Availability Tags */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    When are you available?
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {availabilityOptions.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => {
                          if (formData.availability.includes(time)) {
                            handleRemoveAvailability(time)
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              availability: [...prev.availability, time]
                            }))
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          formData.availability.includes(time)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  {/* Custom Availability Input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newAvailability}
                      onChange={(e) => setNewAvailability(e.target.value)}
                      placeholder="Add custom availability"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddAvailability}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Experience & Motivation */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Experience & Motivation</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Experience
                    </label>
                    <textarea
                      name="previous_experience"
                      rows={3}
                      value={formData.previous_experience}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Tell us about any relevant experience you have..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Why do you want to join this ministry? *
                    </label>
                    <textarea
                      name="motivation"
                      rows={3}
                      required
                      value={formData.motivation}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Share your motivation and what you hope to contribute..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      How did you hear about this ministry?
                    </label>
                    <input
                      type="text"
                      name="heard_from"
                      value={formData.heard_from}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., Church announcement, website, friend"
                    />
                  </div>
                </div>
              </div>

              {/* Newsletter Opt-in */}
              <div className="border-t pt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="newsletter"
                    id="newsletter"
                    checked={formData.newsletter}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-700">
                    I'd like to receive updates about this ministry and church news
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Registration'
                  )}
                </button>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  * Required fields. By submitting this form, you agree to be contacted by ministry leaders.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Confirmation/Status Check */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Check Your Registration Status</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your email to check existing registrations
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={handleCheckExisting}
                    disabled={lookingUp}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {lookingUp ? 'Checking...' : 'Check'}
                  </button>
                </div>
              </div>

              {existingRegistration && existingRegistration.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Your Registrations</h3>
                  <div className="space-y-3">
                    {existingRegistration.map(reg => (
                      <div key={reg.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{reg.ministry?.name}</h4>
                          {getStatusBadge(reg.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          Registered on: {new Date(reg.registration_date).toLocaleDateString()}
                        </p>
                        {reg.status === 'approved' && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ You've been approved! A ministry leader will contact you soon.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <button
                  onClick={() => {
                    setStep(1)
                    setExistingRegistration(null)
                    setLookupEmail('')
                  }}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  ← Back to registration form
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIconSolid className="h-10 w-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in joining {ministry.name}. Your registration has been received and is pending review.
            </p>

            <div className="bg-indigo-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-indigo-800 mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-indigo-700">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                  A ministry leader will review your application
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                  You'll receive an email confirmation with next steps
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                  Feel free to contact us if you have any questions
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/ministries"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Other Ministries
              </Link>
              <button
                onClick={() => {
                  setStep(2)
                  setLookupEmail(formData.email)
                }}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Check Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MinistryRegistrationPage