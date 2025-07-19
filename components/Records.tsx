'use client';

import Image from "next/image";
import { useState } from "react";

export default function QuizCard() {
  // State to manage the selected answer, whether it's correct, and the current question
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Array of questions
  const questions = [
    {
      text: "Which player scored the winning goal in the 2014 World Cup final?",
      options: [
        "Mario Götze",
        "Thomas Müller",
        "Lionel Messi",
        "Ángel Di María"
      ],
      correctAnswer: "Mario Götze",
      feedback: "Correct! Mario Götze scored the winning goal in the 2014 World Cup final.",
 
    },
    {
      text: "Which country won the 2018 FIFA World Cup?",
      options: [
        "France",
        "Croatia",
        "Belgium",
        "England"
      ],
      correctAnswer: "France",
      feedback: "Correct! France won the 2018 FIFA World Cup by defeating Croatia 4-2.",
  
    },
    {
      text: "Who was the top scorer in the 2022 World Cup?",
      options: [
        "Kylian Mbappé",
        "Lionel Messi",
        "Julian Alvarez",
        "Olivier Giroud"
      ],
      correctAnswer: "Kylian Mbappé",
      feedback: "Correct! Kylian Mbappé scored 8 goals in the 2022 World Cup.",
   
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];

  // Handle answer selection and automatic checking
  const handleAnswerClick = (option: string) => {
    if (selectedAnswer) return; // Prevent changing answer after selection
    
    setSelectedAnswer(option);
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    
    // Move to next question after a delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }
    }, 1500);
  };

  // Reset the quiz to start from the first question
  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  return (
    <div className="flex flex-col mt-20 items-center justify-center  bg-gray-50 p-4">
       <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-10">
        Football Knowledge Quiz
      </h1>
      
      <div className="flex flex-col md:flex-row items-center justify-center w-full">
        {/* Left Circle Image */}
        <div className="hidden mb-6 min-h-[77vh] md:flex items-center justify-center md:mb-0 md:mr-10">
          <Image
            src={"/images/image1.png"}
            alt="Quiz illustration"
            width={300}
            height={300}
            className="rounded-full"
          />
        </div>

        {/* Question Card */}
        <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-xl">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            {currentQuestion.text}
          </h2>
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(option)}
                className={`w-full border flex border-lime-400 rounded-md px-6 py-3 text-gray-700 transition
                  ${selectedAnswer === option ? "bg-lime-100" : "hover:bg-lime-50"}
                  ${selectedAnswer && option === currentQuestion.correctAnswer ? "bg-green-200 border-green-500" : ""}
                  ${selectedAnswer === option && !isCorrect ? "bg-red-200 border-red-500" : ""}
                  ${selectedAnswer ? "cursor-default" : "cursor-pointer"}`}
                disabled={!!selectedAnswer}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Feedback */}
          <div className="mt-6">
            {selectedAnswer && (
              <p className={`text-center font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                {isCorrect ? currentQuestion.feedback : `Incorrect. The correct answer is ${currentQuestion.correctAnswer}.`}
              </p>
            )}
            
            {/* Show "Next Question" or "Restart Quiz" button if on last question */}
            {selectedAnswer && currentQuestionIndex === questions.length - 1 && (
              <div className="flex justify-center w-full mt-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 rounded-md w-full text-white bg-lime-500 hover:bg-lime-600 transition"
                >
                  Restart Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}