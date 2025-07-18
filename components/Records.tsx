'use client';

import Image from "next/image";
import { useState } from "react";

export default function QuizCard() {
  // State to manage the selected answer, whether it's correct, and whether the answer has been submitted
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sample question data (can be expanded with an array of questions)
  const question = {
    text: "Which player scored the winning goal in the 2014 World Cup final?",
    options: [
      "Mario Götze",
      "Thomas Müller",
      "Lionel Messi",
      "Ángel Di María"
    ],
    correctAnswer: "Mario Götze"
  };

  // Handle answer selection
  const handleAnswerClick = (option: string) => {
    if (!isSubmitted) {
      setSelectedAnswer(option);
    }
  };

  // Handle answer submission
  const handleSubmit = () => {
    if (selectedAnswer && !isSubmitted) {
      setIsCorrect(selectedAnswer === question.correctAnswer);
      setIsSubmitted(true);
    }
  };

  // Reset the quiz for a new attempt
  const handleReset = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setIsSubmitted(false);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-gray-50 p-4">
      {/* Left Circle Image */}
      <div className="mb-6 md:mb-0 md:mr-10">
        <Image
          src="/images/image1.png"
          alt="Brain Circle"
          width={300}
          height={300}
          className="rounded-full"
        />
      </div>

      {/* Question Card */}
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          {question.text}
        </h2>
        <div className="space-y-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerClick(option)}
              className={`w-full border flex border-lime-400 rounded-md px-6 py-3 text-gray-700 transition
                ${selectedAnswer === option ? "bg-lime-100" : "hover:bg-lime-50"}
                ${isSubmitted && option === question.correctAnswer ? "bg-green-200 border-green-500" : ""}
                ${isSubmitted && selectedAnswer === option && !isCorrect ? "bg-red-200 border-red-500" : ""}
                ${isSubmitted ? "cursor-default" : "cursor-pointer"}`}
              disabled={isSubmitted}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Feedback and Controls */}
        <div className="mt-6">
          {isSubmitted && (
            <p className={`text-center font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
              {isCorrect
                ? "Correct! Mario Götze scored the winning goal in the 2014 World Cup final."
                : `Incorrect. The correct answer is ${question.correctAnswer}.`}
            </p>
          )}
          <div className="flex justify-center w-full mt-4">
            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                className={`px-6 py-2 rounded-md w-full text-white transition
                  ${selectedAnswer ? "bg-lime-500 hover:bg-lime-600" : "bg-gray-400 cursor-not-allowed"}`}
                disabled={!selectedAnswer}
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="px-6 py-2 rounded-md w-full text-white bg-lime-500 hover:bg-lime-600 transition"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}