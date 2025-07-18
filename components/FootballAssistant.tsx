'use client';

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { FaTrophy, FaArrowRight } from "react-icons/fa";

export default function FootballQuizIntro() {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen  px-6 py-12">
      <div className="text-center max-w-xl w-full bg-gradient-to-br from-white via-green-100 to-lime-300 rounded-2xl shadow-lg p-10 space-y-6">
        <div className="flex justify-center">
          <div className="flex justify-center">
            <motion.div 
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "reverse",
                duration: 2 
              }}
              className="relative w-24 h-24"
            >
              <Image
                src="/images/image12.png"
                alt="Quiz Icon"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </motion.div>
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">
          Test Your Football Knowledge
        </h1>
        <p className="text-gray-600 text-lg">
          Are you a true football fan? Prove it by taking our fun and challenging quiz!
        </p>
         <Link href="/quiz">
         <button
            ref={buttonRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative overflow-hidden group bg-gradient-to-r from-lime-500 to-green-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Take the Quiz Now
              <FaArrowRight className={`transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </span>
            <span 
              className="absolute inset-0 bg-gradient-to-r from-green-600 to-lime-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"
              aria-hidden="true"
            ></span>
          </button></Link>
      </div>
    </div>
  );
}
