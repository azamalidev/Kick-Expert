'use client'

import { motion } from "framer-motion"
import { FileText } from "lucide-react"
import Image from "next/image"

const TermsOfService = () => {
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
              <FileText className="w-6 h-6 text-lime-600 mr-3" />
              <span className="text-base font-semibold text-lime-700 uppercase tracking-wide">
                Terms of Service
              </span>
            </div>
            <div className="text-center mb-20">
          <div className="inline-block relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400 mb-2 p-2">
              Governing Your Experience
            </h2>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-green-400 to-lime-300 rounded-full" />
          </div>
          
          <p className="mt-8 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
           Last updated: July 14, 2025 - Rules and guidelines for using KickExpert
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
              <p className="text-gray-700 text-base mb-4">
                Welcome to KickExpert. These Terms of Service ("Terms") govern your use of our platform, including our website, quizzes, AI features, competitions, and wallet system.
              </p>
              <p className="text-gray-700 text-base">
                By using KickExpert, you agree to these terms. Please read them carefully.
              </p>
            </motion.div>
          </motion.div>

          {/* Eligibility */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              Eligibility
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base">
                You must be at least 18 years old and legally allowed to participate in skill-based competitions in your country of residence. By signing up, you confirm that you meet these requirements.
              </p>
            </motion.div>
          </motion.div>

          {/* What We Offer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              What We Offer
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base mb-4">
                KickExpert provides:
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    AI-powered football Q&A (Ask AI)
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Football knowledge quizzes
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Timed, skill-based competitions with real-money prizes
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    A wallet system for deposits, entry fees, and payouts
                  </span>
                </li>
              </ul>
              <p className="text-gray-700 text-base mt-4">
                All competitions are skill-based — outcomes are determined by the accuracy of your answers, the speed of your submissions, and your overall performance, not chance.
              </p>
            </motion.div>
          </motion.div>

          {/* Your Account */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              Your Account
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base mb-4">
                You agree to:
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Provide accurate information
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Keep your login credentials secure
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Use only one account
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Be responsible for any activity that happens under your account
                  </span>
                </li>
              </ul>
              <p className="text-gray-700 text-base mt-4">
                We reserve the right to suspend or close accounts in cases of suspected fraud, abuse, or violation of our rules.
              </p>
            </motion.div>
          </motion.div>

          {/* Deposits & Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              Deposits & Wallet
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
                    Deposits are made via Stripe or PayPal and stored in your KickExpert wallet
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Deposits are non-refundable unless there is a confirmed technical error
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Wallet balances are not interest-bearing and cannot be transferred between users
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Competitions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              Competitions
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
                    Entry fees vary per competition and are deducted from your wallet
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Each competition includes a timed quiz; scoring is based on both accuracy and speed
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    If a competition is canceled (e.g., due to system issues), entry fees will be refunded to your wallet
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Payouts */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              Payouts
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
                    Minimum payout is $10
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Identity verification may be required before withdrawal
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Payouts are processed securely via Stripe or PayPal within 2–7 business days
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    U.S.-based users earning $600 or more in a calendar year will receive a Form 1099-MISC for tax reporting
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Fair Use & Conduct */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              Fair Use & Conduct
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base mb-4">
                You agree not to:
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Cheat, use bots, or submit automated answers
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Open multiple accounts or impersonate other users
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Interfere with the platform’s performance or abuse its features
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Misuse AI-generated content (e.g., copying it directly into competitions)
                  </span>
                </li>
              </ul>
              <p className="text-gray-700 text-base mt-4">
                Violations may lead to suspension or permanent ban without refund.
              </p>
            </motion.div>
          </motion.div>

          {/* Content Accuracy & AI Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              Content Accuracy & AI Disclaimer
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base">
                KickExpert uses advanced AI to deliver football knowledge. While we strive for accuracy, responses may occasionally contain outdated or incorrect information. All content is for educational and entertainment purposes only.
              </p>
            </motion.div>
          </motion.div>

          {/* Termination */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              Termination
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-700 text-base">
                We reserve the right to suspend or terminate your account if you breach these Terms, misuse the platform, or violate applicable laws.
              </p>
            </motion.div>
          </motion.div>

          {/* Governing Law */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <FileText className="w-6 h-6 text-lime-600" />
              </div>
              Governing Law
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gradient-to-r from-lime-600 to-teal-500 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <p className="text-gray-100 text-base">
                These Terms are governed by the laws of the State of New Mexico, United States.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default TermsOfService