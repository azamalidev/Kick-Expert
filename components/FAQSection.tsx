"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

export default function FAQSection() {
  const [selectedFAQ, setSelectedFAQ] = useState(1)

  const faqs = [
    {
      id: 0,
      question: "Cursus at est venenatis in.",
      answer: {
        title: "Cursus at est venenatis vitae luctus.",
        content:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dictum arcu, dolor, molestie feugiat rutrum id urna quisque purus. Sit ut non urna auctor libero, dictumst ut adipiscing. Platea non convallis vel iaculis nec odio. Nulla habitant felis laoreet pharetra scelerisque placerat scelerisque interdum.",
      },
    },
    {
      id: 1,
      question: "Posuere amet vel egestas malesuada vel odio neque.",
      answer: {
        title: "Blandit nec feugiat vitae luctus.",
        content:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dictum arcu, dolor, molestie feugiat rutrum id urna quisque purus. Sit ut non urna auctor libero, dictumst ut adipiscing. Platea non convallis vel iaculis nec odio. Nulla habitant felis laoreet pharetra scelerisque placerat scelerisque interdum. Lacus habitasse neque, scelerisque aliquet. Nec, bibendum viverra vitae, molestie cum ut. Pharetra lectus volutpat arcu ut ultrices eu sit volutpat. Pretium egestas in massa cursus ornare. Amet, non gravida rutrum luctus",
      },
    },
    {
      id: 2,
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      answer: {
        title: "Lorem ipsum dolor vitae luctus.",
        content:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dictum arcu, dolor, molestie feugiat rutrum id urna quisque purus. Sit ut non urna auctor libero, dictumst ut adipiscing. Platea non convallis vel iaculis nec odio.",
      },
    },
    {
      id: 3,
      question: "Quam nunc dolor varius.",
      answer: {
        title: "Quam nunc dolor varius luctus.",
        content:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dictum arcu, dolor, molestie feugiat rutrum id urna quisque purus. Sit ut non urna auctor libero, dictumst ut adipiscing.",
      },
    },
  ]

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FAQ Heading */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">FAQ</h2>
        </div>

        {/* FAQ Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left side - FAQ Questions (Reduced width) */}
          <div className="lg:col-span-2 bg-white border border-green-500 rounded-lg p-6 sm:p-8">
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="flex items-start space-x-3 cursor-pointer group"
                  onClick={() => setSelectedFAQ(faq.id)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {selectedFAQ === faq.id ? (
                      <Minus className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <p
                    className={`text-sm sm:text-base leading-relaxed transition-colors ${
                      selectedFAQ === faq.id ? "text-gray-400" : "text-gray-900 group-hover:text-gray-700"
                    }`}
                  >
                    {faq.question}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - FAQ Answer (Expanded width) */}
          <div className="lg:col-span-3 bg-white border border-green-500 rounded-lg p-6 sm:p-8">
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{faqs[selectedFAQ].answer.title}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{faqs[selectedFAQ].answer.content}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
