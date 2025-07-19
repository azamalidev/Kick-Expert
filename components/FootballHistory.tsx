'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function FootballHistory2() {
  const router = useRouter();

  const handleQuestionClick = (question: string) => {
    sessionStorage.setItem('presetQuestion', question);
    router.push('?question=' + encodeURIComponent(question));
    const element = document.getElementById('football-example');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

 const questions = [
  "Which country won the 2018 World Cup?",
  "Who has the most World Cup goals?",
  "When was the first FIFA World Cup held?"
];


  return (
    <div className="bg-stone-50 flex justify-center px-4 pt-12 ">
      <div className="flex flex-col items-center w-full max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] text-center mb-10">
          Try These Examples
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-14 w-full">
          {/* Suggestion Buttons */}
          <div className="flex flex-col items-center space-y-5 w-full max-w-sm">
            {questions.map((text, i) => (
              <button
                key={i}
                onClick={() => handleQuestionClick(text)}
                className="w-full border border-lime-500 bg-white hover:bg-lime-50 text-[#0f172a] font-medium px-4 py-3 rounded-full text-sm md:text-base transition-all shadow-sm hover:shadow-md"
              >
                {text}
              </button>
            ))}
          </div>

          {/* Image */}
          <div className="hidden md:flex justify-center items-center">
            <div className="relative w-60 h-60 md:w-64 md:h-64 rounded-full overflow-hidden ">
              <Image
                src="/images/image1.png"
                alt="Brain Icon"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
