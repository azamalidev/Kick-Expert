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
    <section className="py-16 sm:py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Customer Reviews Section */}
        <div className="text-center mb-16">
          <div className="inline-block relative mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              What Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400">Community</span> Says
            </h2>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-green-400 to-lime-300 rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white rounded-2xl shadow-lg p-8 sm:p-12">
            {/* Rating overview */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="flex flex-col items-center lg:items-start mb-6">
                <span className="text-5xl sm:text-6xl font-bold text-gray-900 mb-2">4.7</span>
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-6 h-6 sm:w-7 sm:h-7 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg text-gray-600">Based on 1,315 reviews</p>
              </div>

              <div className="w-full max-w-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-500">TrustScore</span>
                  <span className="text-sm font-medium text-gray-500">Excellent</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-lime-400 h-2.5 rounded-full" 
                    style={{ width: '92%' }}
                  />
                </div>
              </div>
            </div>

            {/* Rating breakdown */}
            <div className="space-y-4">
              {reviewData.map((review) => (
                <div key={review.stars} className="flex items-center">
                  <div className="flex items-center w-16">
                    <span className="text-base font-medium text-gray-900 mr-2">{review.stars}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-lime-400 h-2.5 rounded-full" 
                        style={{ width: `${review.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-12 text-right">{review.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-green-600 to-lime-500 rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Newsletter content */}
            <div className="p-8 sm:p-12 lg:p-16 text-white">
              <div className="mb-2 inline-flex items-center gap-2 bg-white/20 px-4 py-1 rounded-full">
                <Star className="w-4 h-4 fill-white" />
                <span className="text-sm font-medium">Stay Updated</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                KickExpert Newsletter
              </h3>
              <p className="text-lg text-white/90 mb-8">
                Get the latest football insights, tactics, and updates delivered to your inbox.
              </p>

              <div className="flex max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 text-base text-gray-900 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-lime-300"
                />
                <button className="px-6 py-3 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <span>Join</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Featured content */}
            <div className="bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
              <div className="mb-4 inline-flex items-center gap-2 bg-gray-100 px-4 py-1 rounded-full">
                <span className="text-xs font-medium text-gray-600">FEATURED ARTICLE</span>
              </div>
              
              <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                5 Exercises Football Players Should Use To Develop Strength
              </h4>
              <p className="text-gray-600 mb-6">
                Strength in football isn't all about massive body mass. Discover the key exercises that improve performance on the pitch.
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">JK</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Jake Willmore</p>
                  <p className="text-xs text-gray-500">HealthListed.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}