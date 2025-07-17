'use client'

import { motion } from "framer-motion"
import { DollarSign } from "lucide-react"
import Image from "next/image"

const RefundPayoutPolicy = () => {
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
              <DollarSign className="w-6 h-6 text-lime-600 mr-3" />
              <span className="text-base font-semibold text-lime-700 uppercase tracking-wide">
                Refund & Payout Policy
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 p-2 bg-clip-text text-transparent bg-gradient-to-r from-lime-600 to-teal-500">
              Managing Your Funds
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              Last updated: July 14, 2025 - How we handle deposits, refunds, and payouts
            </p>
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
                This policy outlines how refunds and payouts work on KickExpert. It applies to all users who deposit funds, enter competitions, and request withdrawals through the platform.
              </p>
            </motion.div>
          </motion.div>

          {/* Deposits */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <DollarSign className="w-6 h-6 text-lime-600" />
              </div>
              Deposits
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
                    All deposits are final and non-refundable unless there is a confirmed technical error or unauthorized transaction.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Deposits are made via Stripe or PayPal and credited instantly to your KickExpert wallet.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Any attempted chargebacks will result in immediate account suspension and loss of wallet balance.
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Quiz Access */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <DollarSign className="w-6 h-6 text-lime-600" />
              </div>
              Quiz Access
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
                    All quizzes are free to access and do not require payment.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Only competitions require entry fees.
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Competition Entry Fees */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <DollarSign className="w-6 h-6 text-lime-600" />
              </div>
              Competition Entry Fees
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
                    Entry fees are deducted from your KickExpert wallet balance at the time you join a competition.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Fees are non-refundable once a competition has started.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    If a competition is canceled (e.g., due to a system failure), your entry fee will be automatically refunded to your wallet.
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Payouts (Withdrawals) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <DollarSign className="w-6 h-6 text-lime-600" />
              </div>
              Payouts (Withdrawals)
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
                    You may request a payout once your wallet balance reaches $10 or more.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Payouts are sent via Stripe or PayPal only.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Identity verification may be required before withdrawal.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    Payouts are typically processed within 2 to 7 business days.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    We do not charge withdrawal fees, but third-party processors (Stripe/PayPal) may apply transaction charges.
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Taxes (U.S. Users) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <DollarSign className="w-6 h-6 text-lime-600" />
              </div>
              Taxes (U.S. Users)
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
                    If you earn $600 or more in a calendar year, you may be required to submit a completed IRS Form W-9.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  </div>
                  <span className="text-base font-medium">
                    In such cases, KickExpert will issue a Form 1099-MISC as required by U.S. tax law.
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Fraud or Abuse */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true, margin: "-50px" }}
            className="mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4 shadow-sm">
                <DollarSign className="w-6 h-6 text-lime-600" />
              </div>
              Fraud or Abuse
            </h2>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gradient-to-r from-lime-600 to-teal-500 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ul className="space-y-4 text-gray-100">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                  <span className="text-base font-medium">
                    Accounts suspected of fraud, cheating, or violating our Terms of Service may be restricted from withdrawals until the issue is reviewed.
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                  <span className="text-base font-medium">
                    We reserve the right to deny a refund or payout if we detect abuse of the system or refund policy.
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default RefundPayoutPolicy