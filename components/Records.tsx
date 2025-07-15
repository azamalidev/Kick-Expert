// components/QuizCard.js

import Image from "next/image";

export default function QuizCard() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-gray-50 p-4">
      {/* Left Circle Image */}
      <div className="mb-6 md:mb-0 md:mr-10">
        <Image  src="/images/image1.png"
          alt="Brain Circle"
          width={300}
          height={300}
          className="rounded-full"
        />
      </div>

      {/* Question Card */}
     <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-xl">
  <h2 className="text-xl font-semibold mb-6 text-gray-800">
    Which player scored the winning goal in the 2014 World Cup final?
  </h2>
  <div className="space-y-4">
    {Array(4)
      .fill("Thomas Muller")
      .map((option, index) => (
        <button
          key={index}
          className="w-full border flex border-lime-400 rounded-md px-6 py-3 text-gray-700 hover:bg-lime-50 transition"
        >
          {option}
        </button>
      ))}
  </div>
</div>

    </div>
  );
}
