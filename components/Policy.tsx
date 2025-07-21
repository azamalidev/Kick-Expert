'use client'

import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import Image from "next/image"

const Policy = () => {
  return (
    <>
      {/* Hero Section */}
      <section className=" hidden md:block relative w-full mt-16 h-64 sm:h-80 lg:h-96 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/image10.png"
            alt="Privacy Policy Background"
            fill
            className="object-cover opacity-90"
            priority
          />
          {/* <div className="absolute inset-0 bg-gradient-to-b from-lime-600/30 to-teal-500/30"></div> */}
        </div>
        <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-3 sm:mb-5">
              <span className="text-lime-400">Kick</span>
              <span className="text-white">Expert</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-5">
              Privacy Policy
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/90 font-medium">
              We value your privacy
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Subheader */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center justify-center bg-lime-100 px-6 py-3 rounded-full mb-2 shadow-sm">
              <Lock className="w-6 h-6 text-lime-600 mr-3" />
              <span className="text-base font-semibold text-lime-700 uppercase tracking-wide">
                Privacy Policy
              </span>
            </div>
            <div className="text-center mb-20">
          <div className="inline-block relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400 mb-2 p-2">
              Protecting Your Data
            </h2>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-green-400 to-lime-300 rounded-full" />
          </div>
          
          <p className="mt-8 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Last updated: July 14, 2025 - How we collect, use, and safeguard your personal information
          </p>
        </div>
          </motion.div>

          {/* What We Collect */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Lock className="w-6 h-6 text-lime-600" />
              </div>
              What We Collect
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base mb-4">
                When you use KickExpert, we collect the following types of data:
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Account information: name, email, date of birth
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Usage data: your quiz scores, competition activity, AI queries
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Device info: browser type, device model, IP address, general location
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Payment details: securely processed through Stripe and PayPal (we do not store your card info)
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* How We Use Your Data */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Lock className="w-6 h-6 text-lime-600" />
              </div>
              How We Use Your Data
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base mb-4">
                We use your data to:
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Create and manage your account
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Operate quizzes, competitions, and wallet functionality
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Analyze platform performance and user trends
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Prevent fraud and enforce fair play
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Process deposits and payouts securely
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Comply with legal and tax obligations
                  </span>
                </li>
              </ul>
              <p className="text-gray-700 text-base mt-4">
                We do not sell your personal data under any circumstances.
              </p>
            </motion.div>
          </motion.div>

          {/* AI Content & User Queries */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Lock className="w-6 h-6 text-lime-600" />
              </div>
              AI Content & User Queries
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base mb-4">
                When you ask questions via the Ask AI feature, your input is processed through third-party AI providers (e.g., OpenAI) to generate responses. These queries may be logged for performance monitoring, abuse detection, and content improvements.
              </p>
              <p className="text-gray-700 text-base">
                AI responses are educational and informational only.
              </p>
            </motion.div>
          </motion.div>

          {/* Data Sharing */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Lock className="w-6 h-6 text-lime-600" />
              </div>
              Data Sharing
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base mb-4">
                We only share your data with trusted third parties essential to operating KickExpert:
              </p>
              <ul className="space-y-4 text-gray-700 mb-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Stripe and PayPal (for payment processing)
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Analytics providers (e.g., Google Analytics, Meta Pixel)
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Identity verification partners (for secure withdrawals)
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Regulatory and tax authorities (where required by law)
                  </span>
                </li>
              </ul>
              <p className="text-gray-700 text-base">
                All partners are required to handle your data securely and in accordance with applicable laws.
              </p>
            </motion.div>
          </motion.div>

          {/* Data Security */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Lock className="w-6 h-6 text-lime-600" />
              </div>
              Data Security
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base mb-4">
                We implement:
              </p>
              <ul className="space-y-4 text-gray-700 mb-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    SSL encryption on all data transmissions
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Secure authentication protocols
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Continuous monitoring and access control
                  </span>
                </li>
              </ul>
              <p className="text-gray-700 text-base">
                You are responsible for keeping your login credentials secure. We are not liable for unauthorized access due to compromised user devices or weak passwords.
              </p>
            </motion.div>
          </motion.div>

          {/* Your Rights */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Lock className="w-6 h-6 text-lime-600" />
              </div>
              Your Rights
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base mb-4">
                You have the right to:
              </p>
              <ul className="space-y-4 text-gray-700 mb-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Access the data we store about you
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Correct or update your personal information
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Request deletion of your account and data (unless we are required to retain it for legal reasons)
                  </span>
                </li>
              </ul>
              <p className="text-gray-700 text-base">
                To exercise your rights, please reach out through our Contact Us page.
              </p>
            </motion.div>
          </motion.div>

          {/* Cookies */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Lock className="w-6 h-6 text-lime-600" />
              </div>
              Cookies
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base mb-4">
                We use cookies to:
              </p>
              <ul className="space-y-4 text-gray-700 mb-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Save your login preferences
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Measure usage and improve functionality
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Track anonymized analytics and advertising data
                  </span>
                </li>
              </ul>
              <p className="text-gray-700 text-base">
                You can manage or disable cookies through your browser settings. More details are provided in our Cookie Policy.
              </p>
            </motion.div>
          </motion.div>

          {/* Minors */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Lock className="w-6 h-6 text-lime-600" />
              </div>
              Minors
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base">
                KickExpert is intended for users 18 years and older. We do not knowingly collect or process data from individuals under 18 years of age.
              </p>
            </motion.div>
          </motion.div>

          {/* Policy Updates */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Lock className="w-6 h-6 text-lime-600" />
              </div>
              Policy Updates
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gradient-to-r from-lime-600 to-teal-500 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-100 text-base mb-4">
                If we make changes to this policy, the updated version will be posted here with the revised date. Continued use of the platform implies acceptance of the changes.
              </p>
              <p className="text-sm text-gray-200">
                Last updated: July 14, 2025
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default Policy