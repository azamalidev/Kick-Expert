'use client'

import { motion } from "framer-motion"
import { Scale } from "lucide-react"

const FairPlayPolicy = () => {
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
      <div className="inline-flex items-center justify-center bg-lime-100 px-5 py-2 rounded-full mb-2">
            <Scale className="w-5 h-5 text-lime-600 mr-2" />
            <span className="text-sm font-semibold text-lime-700 uppercase tracking-wide">Fair Play Policy</span>
          </div>
          <div className="text-center mb-20">
          <div className="inline-block relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400 mb-2 p-2">
              Fair Play Policy
            </h2>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-green-400 to-lime-300 rounded-full" />
          </div>
          
          <p className="mt-8 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Last updated: July 14, 2025 - Ensuring a level playing field for all
          </p>
        </div>
        </motion.div>

        {/* Knowledge-Based Only */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Scale className="w-5 h-5 text-lime-600" />
            </div>
            Knowledge-Based Only
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  All competitions are based on football knowledge and mental speed
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  There are no chance-based elements, betting mechanics, or random outcomes
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Winners are determined solely by performance: correct answers + submission speed
                </span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* No Cheating, Bots, or Scripts */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Scale className="w-5 h-5 text-lime-600" />
            </div>
            No Cheating, Bots, or Scripts
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Use of browser extensions, automation tools, AI-generated answers, or scripts is strictly prohibited
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Users caught attempting to manipulate game outcomes will be disqualified
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Accounts involved in cheating or suspicious behavior may be suspended or permanently banned without refund
                </span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* One Account Per Person */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Scale className="w-5 h-5 text-lime-600" />
            </div>
            One Account Per Person
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Each individual may use only one KickExpert account
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Duplicate accounts or shared access will result in disqualification and forfeiture of wallet funds
                </span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Integrity in AI Usage */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Scale className="w-5 h-5 text-lime-600" />
            </div>
            Integrity in AI Usage
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  The Ask AI feature is for learning, not competition
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Copy-pasting AI answers into competitions violates the spirit of fair play
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Excessive or abusive behavior within Ask AI may result in access restrictions
                </span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Transparency & Review */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Scale className="w-5 h-5 text-lime-600" />
            </div>
            Transparency & Review
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Scoring logic, timing, and leaderboard calculations are consistent for all users
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  If you believe a competition result was affected by a bug or error, you may request a review via the Contact page
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  We reserve the right to audit competition sessions to ensure compliance
                </span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Be a Good Sport */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center mr-4">
              <Scale className="w-5 h-5 text-lime-600" />
            </div>
            Be a Good Sport
          </h2>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  Respect the community, your fellow competitors, and the integrity of the platform
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                </div>
                <span className="text-base font-medium">
                  KickExpert is built for thinkers, learners, and competitors not cheaters or opportunists
                </span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default FairPlayPolicy