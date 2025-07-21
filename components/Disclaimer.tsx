'use client'

import { motion } from "framer-motion"
import { Shield } from "lucide-react"

const Disclaimer = () => {
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
          <div className="inline-flex items-center justify-center bg-lime-100 px-5 py-2 rounded-full mb-6">
            <Shield className="w-5 h-5 text-lime-600 mr-2" />
            <span className="text-sm font-semibold text-lime-700 uppercase tracking-wide">Disclaimer</span>
          </div>
         <div className="text-center mb-20">
          <div className="inline-block relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400 mb-4">
              KickExpert Disclaimer
            </h2>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-green-400 to-lime-300 rounded-full" />
          </div>
          
          <p className="mt-8 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
             Last updated: July 14, 2025 - Important information about your use of our platform.
          </p>
        </div>
        </motion.div>

        {/* AI Content Disclaimer */}
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
            AI Content Disclaimer
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Responses from the Ask AI feature are powered by third-party language models (e.g., GPT-4o).
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  While we strive for relevance and accuracy, AI-generated content may include factual errors or outdated information.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  You are responsible for verifying any critical information obtained through the AI feature.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  AI content is not to be treated as expert advice or official statistics.
                </span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* No Gambling or Betting */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Shield className="w-5 h-5 text-lime-600" />
            </div>
            No Gambling or Betting
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  KickExpert does not offer or promote gambling, betting, or games of chance.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  All competitions on the platform are knowledge-based and skill-driven.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Outcomes are determined strictly by user performance — including answer accuracy and submission speed.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  No odds, wagering, or randomized outcomes are involved.
                </span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Personal Responsibility */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Shield className="w-5 h-5 text-lime-600" />
            </div>
            Personal Responsibility
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Your use of the platform is at your own risk.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  KickExpert is not responsible for any losses (financial or otherwise) resulting from reliance on quiz outcomes, leaderboard placement, or AI responses.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  All participation in competitions is voluntary and governed by your agreement to our Terms of Service.
                </span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Platform Availability */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Shield className="w-5 h-5 text-lime-600" />
            </div>
            Platform Availability
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  While we work to ensure consistent service, KickExpert is not liable for disruptions, outages, or technical errors that may impact competitions or quiz access.
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  If a system error prevents a competition from running properly, entry fees will be refunded per our Refund Policy.
                </span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Disclaimer