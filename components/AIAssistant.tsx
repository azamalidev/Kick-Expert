import Image from "next/image";
import { useState } from "react";

export default function AIQuestionAssistant() {
  const [selected, setSelected] = useState("Medium");
  return (
    <div id="quiz-section" className="relative bg-stone-50 px-4 pt-12  md:pt-20 text-center overflow-hidden">

      <div className="absolute  sm:top-20 md:top-8 right-0   sm:right-80 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 z-40">
        <Image
          src="/images/image2.png"
          alt="Decorative Spiral"
          fill
          className="object-contain"
        />
      </div>
      <p className="text-[#8BC34A] font-semibold text-sm md:text-base mb-2 z-10 relative">
        AI Assistant
      </p>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1f2937] mb-6 z-10 relative">
        AI Football Assistant
      </h1>

       <div className="flex flex-wrap items-center justify-center gap-8 mb-10 z-10 relative">
      <span className="font-bold text-2xl text-[#1f2937]">Question Difficulty:</span>

      <button
        onClick={() => setSelected("Easy")}
        className={`${
          selected === "Easy" ? "bg-lime-400" : "bg-white border border-[#C5FF66]"
        } text-[#1f2937] font-semibold px-4 py-2 rounded-md flex items-center gap-2 shadow-sm 
        hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer`}
      >
        ⚡ Easy
      </button>

      <button
        onClick={() => setSelected("Medium")}
        className={`${
          selected === "Medium" ? "bg-lime-400" : "bg-white border border-[#C5FF66]"
        } text-[#1f2937] font-semibold px-4 py-2 rounded-md shadow-sm 
        hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer`}
      >
        Medium
      </button>

      <button
        onClick={() => setSelected("Hard")}
        className={`${
          selected === "Hard" ? "bg-lime-400" : "bg-white border border-[#C5FF66]"
        } text-[#1f2937] font-semibold px-4 py-2 rounded-md flex items-center gap-2 shadow-sm 
        hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer`}
      >
        ⚡ Hard
      </button>
    </div>



    </div>
  );
}
