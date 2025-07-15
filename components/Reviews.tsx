"use client"

import { useState } from "react"
import { Star, ArrowRight } from "lucide-react"

export default function CustomerReviews() {
  const [email, setEmail] = useState("")

  const reviewData = [
    { stars: 5, percentage: 75, count: 982 },
    { stars: 4, percentage: 16, count: 205 },
    { stars: 3, percentage: 5, count: 65 },
    { stars: 2, percentage: 1, count: 17 },
    { stars: 1, percentage: 3, count: 46 },
  ]

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Customer Reviews Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-6">Customers reviews</h2>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Left side - Rating overview */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="flex items-center mb-2">
                <span className="text-4xl sm:text-5xl font-bold text-gray-800 mr-2">4.7</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600">1315 reviews</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-xs text-center lg:text-left">
                A Discount Toner Cartridge Is Better Than Ever And You Will Save 50 Or More
              </p>
            </div>

            {/* Right side - Rating breakdown */}
            <div className="flex-1 max-w-md mx-auto lg:mx-0">
              {reviewData.map((review) => (
                <div key={review.stars} className="flex items-center mb-2 sm:mb-3">
                  <span className="text-sm sm:text-base text-gray-600 w-4 mr-3">{review.stars}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 sm:h-3 mr-3">
                    <div className="bg-lime-400 h-full rounded-full" style={{ width: `${review.percentage}%` }}></div>
                  </div>
                  <span className="text-sm sm:text-base text-gray-600 w-8 mr-2">{review.percentage}%</span>
                  <span className="text-sm sm:text-base text-gray-400 w-8">{review.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter Subscription Section */}
        <div className="bg-lime-10 rounded-lg p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left side - Newsletter signup */}
            <div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
                <span className="bg-gradient-to-b from-green-900 to-lime-400 text-transparent bg-clip-text">NEWSLETTER</span>
                <br />
                <span className="bg-gradient-to-b from-green-900 to-lime-400 text-transparent bg-clip-text">SUBSCRIPTION</span>
              </h3>

              <div className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shavon.khan0099@gmail.com"
                  className="flex-1 px-2 py-3 text-sm sm:text-base border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
                <button className="px-4 py-3 bg-gray-800 text-white rounded-r-md hover:bg-gray-900">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right side - Article preview */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500 mb-2">04 June 2023</p>
              <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-3">
                5 Exercises Basketball Players Should Be Using To Develop Strength
              </h4>
              <p className="text-xs sm:text-sm text-gray-600">
                This article was written by Jake Willmore from HealthListed.com. Strength in basketball isn't all about
                a massive body mass or ripped muscles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
