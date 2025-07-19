"use client";

import { JSX } from "react";
import { FaBolt, FaUser, FaTrophy } from "react-icons/fa";

export default function FootballHistory() {
  return (
    <div className="relative w-full h-fit mb-20  bg-zinc-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
          Everything You Need To Explore <br className="hidden md:block" />
          About Football
        </h1>
      </div>

      <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8 flex-wrap">
        <Card
          icon={<FaBolt className="text-white text-2xl" />}
          title="Instant AI Answers"
          description="Get immediate, AI-generated responses to any football-related query."
        />
        <Card
          icon={<FaUser className="text-white text-2xl" />}
          title="Personalized Insights"
          description="Tailored content based on your interests in teams, players, and eras."
        />
        <Card
          icon={<FaTrophy className="text-white text-2xl" />}
          title="Explore Iconic Moments"
          description="Relive historic matches, legendary goals, and unforgettable tournaments."
        />
      </div>
    </div>
  );
}

function Card({ icon, title, description }: { icon: JSX.Element; title: string; description: string }) {
  return (
    <div className="bg-white p-6 pt-10 rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300 w-72 h-72 flex flex-col items-center gap-5 text-center">
      <div className="bg-gradient-to-br from-lime-500 to-green-600 rounded-full p-4 shadow-md">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600 max-w-[80%]">{description}</p>
    </div>
  );
}
