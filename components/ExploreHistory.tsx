"use client";

import Image from "next/image";
import { FaBolt, FaUser, FaTrophy } from 'react-icons/fa';

export default function FootballHistory() {
  return (
    <div className="relative w-full h-fit mb-10 mt-10 bg-zinc-50 flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 right-0">
        {/* Placeholder for trivia vector image, e.g., <Image src="/images/trivia-vector.png" alt="Trivia Vector" width={150} height={150} className="object-contain" /> */}
      </div>
      <div className="text-center">
        <p className="text-lime-500 text-sm md:text-base font-bold">Football History</p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2">
          Everything You Need To Explore <br /> Football History
        </h1>
        <div className="mt-8 flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-6">
          <div className="bg-white p-4 pt-10 rounded-3xl shadow-lg w-64 h-64 flex flex-col items-center gap-6">
            <div className="bg-lime-500 rounded-full p-4">
              <FaBolt className="text-black text-2xl" />
            </div>
            <p className="text-gray-800 font-medium">Instant AI Answers</p>
            <p className="text-gray-600 text-sm w-[60%]">Engrossed listening. Park gate sell they west hard for the.</p>
          </div>
          <div className="bg-white p-4 pt-10 rounded-3xl shadow-lg w-64 h-64 flex flex-col items-center gap-6">
            <div className="bg-lime-500 rounded-full p-4">
              <FaUser className="text-black text-2xl" />
            </div>
            <p className="text-gray-800 font-medium">Instant AI Answers</p>
            <p className="text-gray-600 text-sm w-[60%]">Engrossed listening. Park gate sell they west hard for the.</p>
          </div>
          <div className="bg-white p-4 pt-10 rounded-3xl shadow-lg w-64 h-64 flex flex-col items-center gap-6">
            <div className="bg-lime-500 rounded-full p-4">
              <FaTrophy className="text-black text-2xl" />
            </div>
            <p className="text-gray-800 font-medium">Instant AI Answers</p>
            <p className="text-gray-600 text-sm w-[60%]">Engrossed listening. Park gate sell they west hard for the.</p>
          </div>
        </div>
        <div className="mt-8">
          <p className="text-neutral-500 text-sm md:text-base font-semibold">Ask Anything About Football History</p>
          <button className="mt-2 bg-lime-500 text-black text-sm font-bold px-6 py-3 cursor-pointer rounded-lg hover:bg-lime-400 transition duration-300">
            EXPLORE HISTORY
          </button>
        </div>
      </div>

      {/* New AI-Powered Football Trivia Section */}
      <div className="relative w-full h-fit mt-16 bg-zinc-50 flex items-center justify-center px-4">
        <div className="absolute top-0 right-0">
          {/* Placeholder for trivia vector image, e.g., <Image src="/images/trivia-vector.png" alt="Trivia Vector" width={150} height={150} className="object-contain" /> */}
        </div>
        <div className="text-center w-full">
          <p className="text-lime-500 text-sm md:text-base font-bold">Football History</p>
          <h1 className="text-4xl md:text-4xl font-bold text-gray-900 mt-2">
            AI-Powered Football Trivia
          </h1>
          <p className="text-gray-600 text-sm md:text-md text-center mt-2 font-semibold">
            Test Your Knowledge With AI-Generated Questions From Football History.
          </p>
          <div className="flex flex-wrap md:ml-40 items-center gap-20 mt-8">
            {/* Left: Dropdown Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full md:w-auto max-w-md">
              <div className="flex flex-col items-center justify-between gap-4">
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <label className="text-gray-900 text-sm font-bold mb-1">Difficulty:</label>
                  <select className="border-2 border-lime-400 rounded-md p-2 w-full md:w-40 text-gray-700 text-sm outline-0">
                    <option>Select</option>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 w-full md:w-auto">
                  <label className="text-gray-900 text-sm font-bold mb-1">Tournament:</label>
                  <select className="border-2 border-lime-400 rounded-md p-2 w-full md:w-40 text-gray-700 text-sm outline-0">
                    <option>Select</option>
                    <option>World Cup</option>
                    <option>European Championship</option>
                    <option>Copa America</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right: Button */}
            <button className="bg-lime-400 text-black text-sm font-bold px-6 py-3 rounded-lg hover:bg-lime-300 transition duration-300 w-full md:w-auto">
              GENERATE QUESTION
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}