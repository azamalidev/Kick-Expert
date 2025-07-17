'use client'

import { motion } from "framer-motion"
import { Shield, Lock, Settings, BarChart2, TrendingUp, RefreshCw } from "lucide-react"

const CookiePolicy = () => {
  const cookieTypes = [
    {
      name: "Essential Cookies",
      icon: <Lock className="w-6 h-6 text-lime-600" />,
      description: "Required for basic functionality like authentication and secure login.",
      purpose: "Keep your session active and prevent unauthorized access."
    },
    {
      name: "Functional Cookies",
      icon: <Settings className="w-6 h-6 text-lime-600" />,
      description: "Remember your preferences like interface layout or display options.",
      purpose: "Personalize your experience based on your choices."
    },
    {
      name: "Analytics Cookies",
      icon: <BarChart2 className="w-6 h-6 text-lime-600" />,
      description: "Help us understand how users interact with the platform.",
      purpose: "Identify areas for improvement and optimize performance."
    },
    {
      name: "Marketing Cookies",
      icon: <TrendingUp className="w-6 h-6 text-lime-600" />,
      description: "Track performance of ad campaigns and user journeys.",
      purpose: "Measure effectiveness of our marketing efforts."
    }
  ]

  const thirdParties = [
    { name: "Google Analytics", purpose: "Usage tracking and analytics" },
    { name: "Meta Pixel", purpose: "Ad performance and remarketing" },
    { name: "Stripe", purpose: "Secure payment integration" }
  ]

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center justify-center bg-green-100 px-4 py-2 rounded-full mb-2">
            <Shield className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-700">COOKIE POLICY</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold  mb-3 p-2 bg-clip-text text-transparent bg-gradient-to-r from-lime-600 to-teal-500">
            Our Cookie Usage
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
            Last updated: July 14, 2025 - How we use cookies to enhance your experience
          </p>
        </motion.div>

        {/* What Are Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Shield className="w-5 h-5 text-lime-600" />
            </div>
            What Are Cookies?
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <p className="text-gray-700 text-base mb-4">
              Cookies are small text files stored on your browser or device when you visit a website. They help us recognize your session, store preferences, and gather analytics to improve functionality.
            </p>
            <p className="text-gray-700 text-base">
              By using our site, you agree to the use of cookies as described in this policy.
            </p>
          </div>
        </motion.div>

        {/* Why We Use Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Settings className="w-5 h-5 text-lime-600" />
            </div>
            Why We Use Cookies
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">Keep you logged in and manage sessions</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">Save language and interface preferences</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">Analyze how users navigate and interact with the site</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">Improve overall platform performance and usability</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">Measure ad effectiveness (e.g., Google Analytics, Meta Pixel)</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Types of Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <BarChart2 className="w-5 h-5 text-lime-600" />
            </div>
            Types of Cookies We Use
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {cookieTypes.map((cookie, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 bg-lime-100 rounded-xl">
                    {cookie.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{cookie.name}</h3>
                </div>
                <p className="text-gray-600 text-base mb-3">{cookie.description}</p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Purpose:</span> {cookie.purpose}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Third-Party Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <TrendingUp className="w-5 h-5 text-lime-600" />
            </div>
            Third-Party Cookies
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <p className="text-gray-700 text-base mb-6">
              Some cookies are placed by trusted partners, including:
            </p>
            <div className="space-y-4">
              {thirdParties.map((party, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">{party.name}</h4>
                    <p className="text-sm text-gray-600">{party.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm mt-6">
              These third parties may use cookies in accordance with their own privacy and cookie policies.
            </p>
          </div>
        </motion.div>

        {/* Managing Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <RefreshCw className="w-5 h-5 text-lime-600" />
            </div>
            Managing Cookies
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <p className="text-gray-700 text-base mb-4">
              You can control how cookies are used on our platform:
            </p>
            <ul className="space-y-4 text-gray-700 mb-6">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">Accept or reject cookies using the consent banner shown on your first visit</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">Change cookie settings in your browser at any time</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">Delete stored cookies manually via your browser settings</span>
              </li>
            </ul>
            <div className="bg-lime-50 border-l-4 border-lime-500 p-4 rounded-r-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Note:</span> Disabling essential cookies may affect site functionality.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Updates */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="bg-gradient-to-r from-lime-600 to-teal-500 rounded-2xl p-8 text-white shadow-lg">
            <h2 className="text-2xl font-extrabold mb-4">Policy Updates</h2>
            <p className="text-gray-100 text-base mb-4">
              This policy may be updated periodically. The latest version will always be posted on this page with an updated effective date.
            </p>
            <p className="text-sm text-gray-200">
              Last updated: July 14, 2025
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CookiePolicy