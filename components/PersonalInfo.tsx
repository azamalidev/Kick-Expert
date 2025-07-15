"use client"

import { useState } from "react"
import { User, Shield, CreditCard, Gift, Star, Package } from "lucide-react"

export default function PersonalInfo() {
  const [activeSection, setActiveSection] = useState("personal-info")
  const [formData, setFormData] = useState({
    displayName: "",
    realName: "PHAM TRAN LAN CAM NGOC",
    phone: "",
    email: "sunieuv@gmail.com",
    address: "123 Ave, New York, United States",
    website: "",
    twitter: "@twitter username",
  })

  const menuItems = [
    {
      id: "personal-info",
      title: "Personal info",
      icon: User,
    },
    {
      id: "login-security",
      title: "Login and security",
      icon: Shield,
    },
    {
      id: "payments",
      title: "My payments",
      icon: CreditCard,
    },
    {
      id: "voucher",
      title: "My voucher",
      icon: Gift,
    },
    {
      id: "points",
      title: "My points",
      icon: Star,
    },
    {
      id: "orders",
      title: "My orders",
      icon: Package,
    },
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleUpdateProfile = () => {
    console.log("Profile updated:", formData)
  }

  const handleClearAll = () => {
    setFormData({
      displayName: "",
      realName: "",
      phone: "",
      email: "",
      address: "",
      website: "",
      twitter: "",
    })
  }

  return (
    <section className="min-h-screen bg-gray-50 py-12 mt-16 sm:py-16 lg:py-8  ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeSection === item.id
                          ? "bg-lime-100 text-lime-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="text-sm">{item.title}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4 sm:mb-0">Personal info</h1>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  View profile
                </button>
              </div>

              {/* Account Info Section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Account info</h2>

                <div className="space-y-6">
                  {/* Display Name and Real Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">DISPLAY NAME</label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => handleInputChange("displayName", e.target.value)}
                        placeholder="Enter your display name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">REAL NAME</label>
                      <input
                        type="text"
                        value={formData.realName}
                        onChange={(e) => handleInputChange("realName", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Phone and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PHONE</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">EMAIL</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">YOUR ADDRESS</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Social Section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Social</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WEBSITE</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="Your site URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TWITTER</label>
                    <div className="flex flex-col gap-3 md:flex-row space-x-2">
                      <input
                        type="text"
                        value={formData.twitter}
                        onChange={(e) => handleInputChange("twitter", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                      <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium whitespace-nowrap">
                        Verify account
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={handleUpdateProfile}
                  className="bg-lime-400 hover:bg-lime-500 text-white px-6 py-2 rounded-lg font-medium mb-4 sm:mb-0 transition-colors"
                >
                  Update profile
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  ✕ Clear all
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
