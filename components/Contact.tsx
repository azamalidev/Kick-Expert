"use client"

import { useState } from "react"
import { MapPin, Mail, ChevronDown } from "lucide-react"

export default function ContactSection() {
  const [formData, setFormData] = useState({
    topic: "",
    name: "",
    email: "",
    description: "",
  })

  return (
    <section className="py-10  bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400">KickExpert</span>
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're here to help. Whether you have a question, need assistance with your account, or want to report an issue.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left side - Contact Information */}
          <div className="space-y-8 bg-white rounded-2xl shadow-lg p-8 sm:p-10">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">General Support</h3>
                  <p className="text-gray-600">
                    For help with your account, quizzes, competitions, or feedback
                  </p>
                  <a href="mailto:support@kickexpert.com" className="text-green-600 hover:text-green-700 font-medium">
                    support@kickexpert.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Payouts & Wallet</h3>
                  <p className="text-gray-600">
                    For questions about payouts, ID verification, or wallet issues
                  </p>
                  <a href="mailto:payouts@kickexpert.com" className="text-green-600 hover:text-green-700 font-medium">
                    payouts@kickexpert.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Business Address</h3>
                  <address className="text-gray-600 not-italic">
                    KickExpert LLC<br />
                    1209 Mountain Road PL NE, Ste R<br />
                    Albuquerque, NM 87110<br />
                    USA
                  </address>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                We value fair play, clear communication, and community-driven growth.<br />
                We typically respond within 24-48 hours, Monday to Friday.
              </p>
            </div>
          </div>

          {/* Right side - Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h3>
            
            <form className="space-y-5">
              {/* Topic Dropdown */}
              <div className="relative">
                <select 
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select a topic</option>
                  <option value="support">Account Support</option>
                  <option value="payouts">Payouts & Wallet</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <textarea
                  placeholder="Your message"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full px-6 py-3.5 bg-gradient-to-r from-green-600 to-lime-500 text-white font-semibold rounded-lg hover:from-green-700 hover:to-lime-600 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3323.0234567890123!2d-106.5461846847696!3d35.08447598014962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87220c3b06566011%3A0x3a8c0c5e93ab7f4d!2s1209%20Mountain%20Rd%20Pl%20NE%2C%20Albuquerque%2C%20NM%2087110%2C%20USA!5e0!3m2!1sen!2s!4v1620000000000!5m2!1sen!2s"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </section>
  )
}