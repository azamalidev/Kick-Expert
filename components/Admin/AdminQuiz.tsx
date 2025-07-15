"use client"

const quizData = [
  { level: 5, percentage: 75, count: 982 },
  { level: 4, percentage: 16, count: 205 },
  { level: 3, percentage: 5, count: 65 },
  { level: 2, percentage: 1, count: 17 },
  { level: 1, percentage: 3, count: 46 },
]

export default function AdminQuiz() {
  return (
    <div className="w-full">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-lime-200 w-full max-w-2xl mx-auto lg:mx-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quiz Competition</h2>
        <div className="text-sm font-semibold text-gray-600 mb-4">Quiz Status</div>

        <div className="space-y-3 sm:space-y-4">
          {quizData.map((item) => (
            <div key={item.level} className="flex items-center gap-2 sm:gap-3 w-full">
              <span className="w-4 text-sm font-medium text-gray-700 flex-shrink-0">{item.level}</span>
              <div className="relative flex-1 h-2 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-lime-400 rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="w-8 sm:w-10 text-xs sm:text-sm text-gray-600 text-right flex-shrink-0">
                {item.percentage}%
              </span>
              <span className="w-10 sm:w-12 text-xs sm:text-sm text-blue-500 text-right flex-shrink-0">
                {item.count}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button className="w-full bg-lime-400 hover:bg-lime-500 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-200">
            Create Quiz
          </button>
        </div>
      </div>
    </div>
  )
}
