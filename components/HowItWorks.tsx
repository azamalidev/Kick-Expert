'use client'

import { motion } from "framer-motion"
import { Zap, BookOpen, Trophy, Wallet, ArrowUp } from "lucide-react"
import Link from "next/link"

const HowItWorks = () => {
  const steps = [
    {
      title: "Ask AI",
      icon: <Zap className="w-6 h-6" />,
      description: "Get instant answers to any football question from our AI engine.",
      highlights: [
        "Ask freely, anytime",
        "Train your memory and understanding",
        "Perfect for quick learning or deep dives"
      ]
    },
    {
      title: "Take a Quiz",
      icon: <BookOpen className="w-6 h-6" />,
      description: "Test your knowledge with 20 multiple-choice questions.",
      highlights: [
        "Answer at your own pace",
        "Instant feedback after each question",
        "New quizzes generated for progression"
      ],
      scoreRanges: [
        { score: "<10", label: "Good start. Replay to improve." },
        { score: "10-12", label: "Starter League" },
        { score: "13-15", label: "Pro League" },
        { score: "16-20", label: "Elite League" }
      ]
    },
    {
      title: "Join Competitions",
      icon: <Trophy className="w-6 h-6" />,
      description: "Compete in timed events with real rewards.",
      highlights: [
        "Entry fees through your wallet",
        "Questions vary per competition",
        "Scored on accuracy and speed"
      ]
    },
    {
      title: "Claim Prizes",
      icon: <Wallet className="w-6 h-6" />,
      description: "Withdraw winnings through secure payment methods.",
      highlights: [
        "Automatic prize crediting",
        "Minimum $10 payout",
        "2-7 day processing"
      ]
    },
    {
      title: "Climb Leaderboards",
      icon: <ArrowUp className="w-6 h-6" />,
      description: "Track your progress among top football minds.",
      highlights: [
        "Weekly/monthly rankings",
        "Performance-based scoring",
        "Showcase your knowledge"
      ]
    }
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
          <div className="text-center mb-20">
          <div className="inline-block relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400 mb-2 p-2">
              How KickExpert Works
            </h2>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-green-400 to-lime-300 rounded-full" />
          </div>
          
          <p className="mt-8 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
             Transform your football knowledge into victories with our skill-based platform
          </p>
        </div>
        </motion.div>

        {/* Steps */}
        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300"
            >
              {/* Step number */}
              <div className="absolute -top-4 left-6 w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{index + 1}</span>
              </div>
              
              {/* Content */}
              <div className="mt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-lime-100 rounded-xl text-lime-600">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                </div>
                
                <p className="text-gray-600 text-base mb-6">{step.description}</p>
                
                {/* Highlights */}
                <div className="space-y-4">
                  {step.highlights.map((highlight, i) => (
                    <div key={i} className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div>
                      </div>
                      <p className="text-gray-700 text-sm font-medium">{highlight}</p>
                    </div>
                  ))}
                </div>
                
                {/* Score ranges (for quiz step) */}
                {step.scoreRanges && (
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Score Meaning</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {step.scoreRanges.map((range, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-4">
                          <p className="font-bold text-gray-900 text-sm">{range.score}</p>
                          <p className="text-sm text-gray-600">{range.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >
          <div className="bg-gradient-to-r from-lime-600 to-teal-500 rounded-3xl p-10 sm:p-12 shadow-xl">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
              Skill, Not Luck
            </h3>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Showcase your football expertise and rise to the top with every answer.
            </p>
            <Link href={'/livecompetition'}>
            <button className="px-10 py-4 bg-white text-lime-600 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg text-lg">
              Start Your Journey
            </button></Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks