"use client"

import { useState } from "react"
import { MapPin, Phone, Mail, ChevronDown } from "lucide-react"

export default function ContactSection() {
  const [formData, setFormData] = useState({
    topic: "",
    name: "",
    email: "",
    description: "",
  })

  return (
    <section className="py-8 bg-white mx-4 ">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left side - Contact Form */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Contact us</h2>
              <p className="text-sm sm:text-base text-gray-600">
                The harder you work for something, the greater you'll feel when you achieve it.
              </p>
            </div>

            <div className="space-y-3">
              {/* Topic Dropdown */}
              <div className="relative">
                <select className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 appearance-none text-sm">
                  <option>Topic</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Name and Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your name"
                  className="px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                />
              </div>

              {/* Description Textarea */}
              <textarea
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none text-sm"
              />

              {/* Submit Button */}
              <button className="px-5 py-2.5 bg-lime-500 hover:bg-lime-600 text-white font-semibold rounded-md text-sm">
                SEND REQUEST
              </button>
            </div>
          </div>

          {/* Right side - Map and Contact Info */}
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Borem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac
              aliquet odio mattis.
            </p>

            {/* Map Container */}
            <div className="relative w-full h-48 sm:h-56 bg-gray-200 rounded-lg mb-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3323.0234567890123!2d73.0479!3d33.5651!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDMzJzU0LjQiTiA3M8KwMDInNTIuNCJF!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                className="rounded-lg"
              ></iframe>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 bg-lime-500 rounded-full flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-gray-700 font-medium text-sm">Rawalpindi, Punjab 46000</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 bg-lime-500 rounded-full flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-gray-700 font-medium text-sm">00011222333</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 bg-lime-500 rounded-full flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm">info@innoit.org</span>
                </div>

                {/* Social Media Icons */}
                <div className="flex space-x-1.5">
                  <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">S</span>
                  </div>
                  <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">T</span>
                  </div>
                  <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">F</span>
                  </div>
                  <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">Y</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
