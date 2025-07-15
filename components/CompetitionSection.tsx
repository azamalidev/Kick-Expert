"use client";

import Image from "next/image";

export default function LiveCompetition() {
  return (
    <div className="w-full flex items-center justify-center bg-zinc-50">
      <div className="relative w-full md:w-[90%] pt-5 pb-32 bg-gray-900 text-white flex items-center justify-center flex-col text-center">
        <div className="relative w-full">
          <div className="absolute top-0 right-0 hidden md:block">
            <Image
              src="/trophy.png"
              alt="Trophy"
              width={150}
              height={150}
              className="md:w-[200px] md:h-[200px]"
            />
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="bg-lime-400 w-[50%] md:w-[20%] text-black font-bold cursor-pointer px-2 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-base">
              LIVE COMPETITION
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mt-3 md:mt-5">
              Think You Know Football?
            </h1>
            <p className="text-gray-400 mt-3 md:mt-5 text-sm md:text-base">
              Test Your Knowledge Against Other Fans in Our Weekend Trivia Challenge
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-10 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 lg:space-x-36">
          <div className="flex flex-col gap-2 md:gap-4">
            <div className="flex gap-4 md:gap-20 bg-gray-800 px-2 py-1 md:px-6 md:py-3 rounded-lg">
              <p className="text-gray-400 text-xs md:text-base">Players</p>
              <p className="text-white font-bold text-xs md:text-base">247</p>
            </div>
            <div className="bg-gray-800 flex gap-4 md:gap-16 px-2 py-1 md:px-6 md:py-3 rounded-lg">
              <p className="text-gray-400 text-xs md:text-base">Prize Pool</p>
              <p className="text-white font-bold text-xs md:text-base">$50</p>
            </div>
          </div>
          <div className="flex flex-col gap-5 items-center space-x-2 md:space-x-4 md:flex-row lg:space-x-34">
            <div className="flex flex-col gap-1 md:gap-2">
              <p className="font-bold text-xs md:text-base">Ends in:</p>
              <div className="flex gap-1 md:gap-5">
                <div className="bg-lime-400 font-bold rounded-lg text-black px-1 py-1 md:px-4 md:py-2 text-xs">
                  <p className="text-xs md:text-sm">14</p>
                  <p className="text-xs md:text-sm">Hours</p>
                </div>
                <div className="bg-lime-400 font-bold rounded-lg text-black px-1 py-1 md:px-6 md:py-2 text-xs">
                  <p className="text-xs md:text-sm">11</p>
                  <p className="text-xs md:text-sm">Min</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 md:gap-2">
              <div className="flex gap-1 md:gap-3 flex-col">
                <div className="bg-lime-400 font-bold rounded-lg text-black px-2 py-1 md:px-4 md:py-2 text-xs md:text-lg">
                  <p>Join Challenge ($5) <span className="font-bold text-xs md:text-lg">→</span></p>
                </div>
                <p className="text-xs md:text-sm">Winners: $25 • $15 • $10</p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-px bg-white my-5"></div>
        <div className="mb-2 flex items-center">
          <p className="text-gray-400 text-xs md:text-sm">
            Feeling Confident About Your Football Knowledge? <br /> Practice With Our AI, Then Challenge Other Fans For Real Prizes!
          </p>
        </div>
      </div>
    </div>
  );
}