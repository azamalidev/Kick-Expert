'use client'

import { motion } from "framer-motion"
import { Shield } from "lucide-react"
import Image from "next/image"

const TrustAndSafety = () => {
  return (
    <>
     
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
              <Shield className="w-6 h-6 text-lime-600 mr-3" />
              <span className="text-base font-semibold text-lime-700 uppercase tracking-wide">
                Trust & Safety
              </span>
            </div>
            <div className="text-center mb-20">
          <div className="inline-block relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400 mb-2 p-2">
              Ensuring Safe Experience
            </h2>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-green-400 to-lime-300 rounded-full" />
          </div>
          
          <p className="mt-8 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
             Last updated: July 14, 2025 - How we protect your data and ensure fairness
          </p>
        </div>
          </motion.div>

          {/* Introductory Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base">
                At KickExpert, your trust is everything. We’re committed to creating a secure, transparent, and fair experience for every user whether you're here to learn, compete, or win.
              </p>
            </motion.div>
          </motion.div>

          {/* Secure Data & Account Protection */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Shield className="w-6 h-6 text-lime-600" />
              </div>
              Secure Data & Account Protection
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    All data is transmitted using SSL encryption
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Account passwords are securely stored and encrypted
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    We do not store your payment details: Stripe and PayPal handle all transactions directly
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Login activity is monitored to prevent unauthorized access
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Payment & Wallet Security */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Shield className="w-6 h-6 text-lime-600" />
              </div>
              Payment & Wallet Security
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Deposits and payouts are handled by trusted, PCI-compliant processors
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Every transaction is logged and verifiable in your KickExpert wallet history
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Large payouts may require ID verification for added security
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Chargebacks, fraud attempts, or suspicious transactions result in account restrictions
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Fair Access & Equal Competition */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Shield className="w-6 h-6 text-lime-600" />
              </div>
              Fair Access & Equal Competition
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Everyone receives the same questions in each competition
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Timers and question logic are automatically applied for consistency
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Leaderboards are updated transparently, based solely on performance
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Scoring factors include accuracy and speed not luck
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* AI Usage Transparency */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Shield className="w-6 h-6 text-lime-600" />
              </div>
              AI Usage Transparency
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    AI responses are powered by leading third-party models (e.g., OpenAI)
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    We monitor AI usage for abuse, inappropriate prompts, and repeated spam
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Ask AI is a learning tool not a competition shortcut
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Reusing AI answers in competitions may result in disqualification
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Report Concerns */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <Shield className="w-6 h-6 text-lime-600" />
              </div>
              Report Concerns
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gradient-to-r from-lime-600 to-teal-500 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-100 text-base">
                Your voice matters. If you see something unusual  cheating, bugs, offensive content, or fraudulent behavior let us know through the Contact page.
              </p>
              <p className="text-gray-100 text-base mt-4">
                We take every report seriously and investigate promptly
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default TrustAndSafety