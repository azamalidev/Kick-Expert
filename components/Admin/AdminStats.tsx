"use client"

import { Users, ClipboardList, CheckCircle, RefreshCcw, TrendingUp, TrendingDown } from "lucide-react"

const stats = [
  {
    label: "Total User",
    value: "89,935",
    icon: <Users className="text-lime-500" />,
    change: "+1.01%",
    changeValue: "10.2",
    direction: "up",
  },
  {
    label: "Total Quizzes",
    value: "23,283.5",
    icon: <ClipboardList className="text-lime-500" />,
    change: "+0.49%",
    changeValue: "3.1",
    direction: "up",
  },
  {
    label: "Total Subscribers",
    value: "46,827",
    icon: <CheckCircle className="text-lime-500" />,
    change: "-0.91%",
    changeValue: "2.56",
    direction: "down",
  },
  {
    label: "Tasks Matches",
    value: "124,854",
    icon: <RefreshCcw className="text-lime-500" />,
    change: "+1.51%",
    changeValue: "7.2",
    direction: "up",
  },
]

export default function AdminStats() {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-lime-200 hover:shadow-md transition-shadow duration-200 w-full"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-930 truncate">{stat.value}</h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 truncate">{stat.label}</p>
            </div>
            <div className="bg-gray-50 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-3">{stat.icon}</div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm mt-3 sm:mt-4">
            {stat.direction === "up" ? (
              <TrendingUp className="text-green-600 flex-shrink-0" size={14} />
            ) : (
              <TrendingDown className="text-red-600 flex-shrink-0" size={14} />
            )}
            <span className="text-gray-700 font-medium">{stat.changeValue}</span>
            <span className={`${stat.direction === "up" ? "text-green-600" : "text-red-600"} truncate`}>
              {stat.change} this week
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
