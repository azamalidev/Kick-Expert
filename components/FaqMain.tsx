"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Trophy, Zap, BookOpen, Shield, Wallet, Clock, Mail, Star, HelpCircle } from "lucide-react"

const FAQMain = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "What is KickExpert?",
      answer: "KickExpert is a football knowledge platform where fans can ask questions, take quizzes, and compete in skill-based contests to win real prizes. It's designed for both beginners and seasoned football minds who want to learn, improve, and be rewarded.",
      icon: <Star className="w-5 h-5 text-lime-400" />
    },
    {
      question: "Is KickExpert free to use?",
      answer: "Yes. Asking AI questions and taking quizzes is free and unlimited. Only competitions require a small entry fee and those come with prize pools for the top performers.",
      icon: <Zap className="w-5 h-5 text-lime-400" />
    },
    {
      question: "How are the quizzes structured?",
      answer: "Each quiz contains 20 shuffled football-related questions (easy, medium, and hard). You answer at your own pace, receive instant feedback, and get a final score out of 20.",
      icon: <BookOpen className="w-5 h-5 text-lime-400" />
    },
    {
      question: "What happens after I finish a quiz?",
      answer: "You'll see your final score and a league suggestion based on your performance:\n\n- Less than 10: Replay the quiz to sharpen your skills\n- 10-12: Starter League\n- 13-15: Pro League\n- 16-20: Elite League\n\nThis helps you track your progress and decide when you're ready to compete.",
      icon: <Trophy className="w-5 h-5 text-lime-400" />
    },
    {
      question: "How do competitions work?",
      answer: "Competitions are scheduled events (usually on weekends) where users answer a timed set of questions. The number of questions may vary per event.\n\nScoring is based on both accuracy and how quickly you submit your answers. The highest-ranked players win cash prizes.",
      icon: <Clock className="w-5 h-5 text-lime-400" />
    },
    {
      question: "How do I pay for competitions?",
      answer: "You can fund your KickExpert wallet using Stripe or PayPal. Entry fees for competitions are deducted directly from your wallet balance.",
      icon: <Wallet className="w-5 h-5 text-lime-400" />
    },
    {
      question: "How do I get paid if I win?",
      answer: "Winners receive prize money into their wallet. You can request a payout once your balance reaches at least $10. Withdrawals are processed securely through Stripe or PayPal, and may require ID verification.",
      icon: <Wallet className="w-5 h-5 text-lime-400" />
    },
    {
      question: "Is this gambling?",
      answer: "No. KickExpert does not involve chance-based games, betting, or odds. All outcomes are determined by skill—how well and how fast you answer. We are a skill-based competition platform, not a gaming or betting site.",
      icon: <Shield className="w-5 h-5 text-lime-400" />
    },
    {
      question: "Can I use AI tools to cheat?",
      answer: "No. Use of bots, answer scripts, or browser extensions to gain an unfair advantage is strictly prohibited. Offenders will be disqualified, accounts suspended, and funds frozen.",
      icon: <Shield className="w-5 h-5 text-lime-400" />
    },
    {
      question: "I'm new to football trivia. Can I still join?",
      answer: "Absolutely. KickExpert was made for all levels. Use Ask AI and free quizzes to learn and build confidence. When you're ready, competitions are waiting.",
      icon: <HelpCircle className="w-5 h-5 text-lime-400" />
    },
    {
      question: "How do I contact support?",
      answer: "You can reach us anytime at support@kickexpert.com.\nFor questions about payouts or account verification, write to payouts@kickexpert.com.",
      icon: <Mail className="w-5 h-5 text-lime-400" />
    }
  ]

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          {/* <div className="inline-flex items-center justify-center bg-lime-100 px-4 py-2 rounded-full mb-4">
            <HelpCircle className="w-5 h-5 text-lime-600 mr-2" />
            <span className="text-sm font-medium text-lime-700">FAQ</span>
          </div> */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400">Questions</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about KickExpert and how our platform works.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    {faq.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                </div>
                {activeIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 ml-9">
                      <div className="prose prose-sm text-gray-600 whitespace-pre-line">
                        {faq.answer}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}

export default FAQMain