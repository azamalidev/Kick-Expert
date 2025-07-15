"use client"

const matches = [
  {
    title: "Football | Match 8",
    status: "Live",
    teams: ["Patna Pirates", "Gujarat Giants"],
    scores: ["33", "30"],
    note: "Gujarat Giants Empty Raid",
  },
  {
    title: "Football | 2nd Test, Queen's Park",
    status: "Live",
    teams: ["IND", "WI"],
    scores: ["438-10 & 181-2", "255-10 & 76-2*"],
    note: "Stumps: Day 4, WI Need 289 Runs To Win.",
  },
  {
    title: "Football | 3rd Test",
    status: "Match Center",
    teams: ["India", "West Indies"],
    time: "07:30 PM",
    note: "Yet To Begin, Stay Tuned For Live Updates",
  },
  {
    title: "Men's Singles 2023",
    status: "Ended",
    teams: ["R. Nadal", "C. Ruud"],
    scores: ["3", "0"],
    note: "Nadal Won The Match",
  },
]

export default function AdminTicker() {
  return (
    <div className="w-full space-y-4">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Live Matches</h2>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {matches.map((match, i) => (
          <div
            key={i}
            className="bg-white border border-lime-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 w-full"
          >
            {/* Header */}
            <div className="flex justify-between items-start text-xs text-gray-600 font-medium mb-3">
              <span className="truncate pr-2">{match.title}</span>
              <div className="flex-shrink-0">
                {match.status === "Live" && (
                  <span className="text-red-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
                {match.status === "Match Center" && (
                  <span className="bg-lime-500 text-white px-2 py-1 text-[10px] rounded-full">Match Center</span>
                )}
                {match.status === "Ended" && <span className="text-gray-500 text-[10px]">Ended</span>}
              </div>
            </div>

            {/* Teams and Scores */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 truncate pr-2">{match.teams[0]}</span>
                {match.scores && (
                  <span className="font-bold text-sm text-gray-900 flex-shrink-0">{match.scores[0]}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 truncate pr-2">{match.teams[1]}</span>
                {match.scores && (
                  <span className="font-bold text-sm text-gray-700 flex-shrink-0">{match.scores[1]}</span>
                )}
              </div>

              {match.time && (
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                  <span>Today</span>
                  <span>{match.time}</span>
                </div>
              )}
            </div>

            {/* Note */}
            <div className="text-xs text-gray-500 border-t pt-2 leading-relaxed">{match.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
