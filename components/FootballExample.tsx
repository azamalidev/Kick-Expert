'use client';

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { FaArrowRight, FaSearch, FaPaperPlane } from "react-icons/fa";

type Message = {
  text: string;
  sender: "user" | "ai";
  level: "easy" | "medium" | "hard";
};

export default function FootballAssistant() {
  const [activeLevel, setActiveLevel] = useState<"easy" | "medium" | "hard">("medium");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // AI model configurations
  const aiModels = {
    easy: {
      name: "Football Beginner Bot",
      avatar: "👶",
      systemPrompt: `You are a friendly football assistant for beginners. Respond concisely in 1-2 sentences. 
        Provide only the essential fact or result. Avoid extra details, context, stats, or explanations. 
        Assume the user wants a fast, simple answer to a football-related question.`
    },
    medium: {
      name: "Football Analyst",
      avatar: "🧠",
      systemPrompt: `You are a knowledgeable football analyst. Respond in 2-4 informative sentences. 
        Include the key fact and one additional insight such as a relevant stat, comparison, or brief historical background. 
        Keep the tone engaging and helpful without going into deep analysis.`
    },
    hard: {
      name: "Football Professor",
      avatar: "🏆",
      systemPrompt: `You are a football expert with deep knowledge of the game. Respond in 4-6 sentences with expert-level insight. 
        Include the core fact, at least one advanced stat or tactical reference, and meaningful historical or contextual depth. 
        Optionally mention rare trivia, controversies, or player/coach quotes. Assume the user is a highly knowledgeable football fan.`
    }
  };

  // Example questions for each level (moved outside component to prevent hydration issues)
  // const exampleQuestions = {
  //   easy: [
  //     "What is offside in football?",
  //     "How long is a football match?",
  //     "What does a yellow card mean?",
  //     "How many players are on a football team?",
  //     "What is a penalty kick?"
  //   ],
  //   medium: [
  //     "Explain the 4-4-2 formation",
  //     "What makes Lionel Messi special?",
  //     "Compare Cristiano Ronaldo and Messi's playing styles",
  //     "What was significant about the 2005 Champions League final?",
  //     "How has football tactics evolved in the last decade?"
  //   ],
  //   hard: [
  //     "Compare Cruyff's total football with Guardiola's tiki-taka",
  //     "Analyze the impact of xG statistics on modern football",
  //     "What tactical innovations did Arrigo Sacchi bring to AC Milan?",
  //     "How did the Bosman ruling change European football?",
  //     "Explain the false nine role with examples from football history"
  //   ]
  // };

  // Get a random example question for the current level
  // const getRandomExample = () => {
  //   const examples = exampleQuestions[activeLevel];
  //   return examples[Math.floor(Math.random() * examples.length)];
  // };

  const generateAIResponse = async (query: string, level: "easy" | "medium" | "hard") => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: aiModels[level].systemPrompt
            },
            {
              role: "user",
              content: query
            }
          ],
          temperature: 0.7,
          max_tokens: level === "easy" ? 100 : level === "medium" ? 200 : 300
        })
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      return "Sorry, I'm having trouble answering right now. Please try again later.";
    }
  };

  // Typewriter effect for AI messages
  useEffect(() => {
    if (messages.length === 0 || messages.length === displayedMessages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender === "user") {
      setDisplayedMessages(messages);
      return;
    }

    let currentText = "";
    let i = 0;
    const typingSpeed = 20; // milliseconds per character

    const typeWriter = () => {
      if (i < lastMessage.text.length) {
        currentText += lastMessage.text.charAt(i);
        setDisplayedMessages([...messages.slice(0, -1), {
          ...lastMessage,
          text: currentText
        }]);
        i++;
        setTimeout(typeWriter, typingSpeed);
      } else {
        setIsLoading(false);
      }
    };

    typeWriter();
  }, [messages]);

  const handleSearch = async () => {
    if (searchQuery.trim() === "" || isLoading) return;

    // Add user message
    const userMessage: Message = {
      text: searchQuery,
      sender: "user",
      level: activeLevel
    };
    setMessages((prev) => [...prev, userMessage]);
    setSearchQuery("");
    setIsLoading(true);

    try {
      const aiResponseText = await generateAIResponse(searchQuery, activeLevel);
      
      const aiResponse: Message = {
        text: aiResponseText,
        sender: "ai",
        level: activeLevel
      };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorResponse: Message = {
        text: "Sorry, I couldn't process your request. Please try again.",
        sender: "ai",
        level: activeLevel
      };
      setMessages((prev) => [...prev, errorResponse]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [displayedMessages]);

  // Get current AI model info
  const currentModel = aiModels[activeLevel];

  return (
    <div className="flex flex-col items-center justify-center px-4 pt-20 pb-8 md:pt-28 min-h-screen">
      {/* Header section */}
      <div className="relative text-center mb-10 w-full max-w-4xl">
        <div className="flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={50}
            height={50}
            className="w-8 h-8 md:w-15 md:h-15"
          />
          <span className="ml-2 text-lime-400 font-bold text-xl md:text-2xl">
            Kick<span className="text-black ml-1">Expert</span>
          </span>
        </div>
        <h1 className="text-3xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-b from-green-900 to-lime-400 text-transparent bg-clip-text mb-4">
          Ask Anything About Football History
        </h1>
        <p className="text-lime-600 max-w-xl mx-auto text-sm sm:text-base">
          Get instant AI-powered answers about players, matches, goals and tournaments from international Football history 
        </p>
      </div>

      {/* Knowledge level cards */}
      <div className="flex flex-col w-full gap-2">
        <p className="text-lime-600 max-w-xl mx-auto text-sm sm:text-base">
          Choose Your Knowledge Level
        </p>
        <div className="flex flex-row justify-center gap-4 mb-8 w-full max-w-4xl">
          {(["easy", "medium", "hard"] as const).map((level) => (
            <div
              key={level}
              className={`flex-1 border-2 rounded-xl p-2 md:p-4 text-center transition-all cursor-pointer
                ${activeLevel === level
                  ? "border-lime-500 bg-lime-100 shadow-md"
                  : "border-gray-400 hover:border-lime-300"}`}
              onClick={() => setActiveLevel(level)}
            >
              <div className="flex flex-col items-center">
                <span className="text-xl md:text-2xl mb-2">
                  {aiModels[level].avatar}
                </span>
                <h2 className="text-lg font-bold text-gray-800 capitalize">{level}</h2>
                <p className="text-gray-500 text-[10px] md:text-[14px] mt-1">
                  {aiModels[level].name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upper Search Input - Hidden when chat section appears */}
      {messages.length === 0 && (
        <div className="w-full max-w-2xl mb-4">
          <div className="flex items-center border-2 border-gray-500 rounded-xl px-4 py-3 shadow-sm bg-white">
            <FaSearch className="text-gray-700 mr-3" />
            <input
              type="text"
              placeholder={`Ask a ${activeLevel} level question`}
              className="flex-grow outline-none bg-transparent text-base text-gray-700 placeholder-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleSearch}
              className="text-white bg-lime-500 hover:bg-lime-600 p-2 rounded-full transition-colors"
              disabled={isLoading}
            >
              <FaArrowRight />
            </button>
          </div>
          
        </div>
      )}

      {/* Chat Section - Appears after first message */}
      {messages.length > 0 && (
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-xl mr-2">{currentModel.avatar}</span>
              <h3 className="text-lg font-semibold text-gray-800">
                {currentModel.name}
              </h3>
            </div>
            <span className="px-3 py-1 bg-lime-100 text-lime-800 text-xs font-medium rounded-full">
              {activeLevel} level
            </span>
          </div>

          <div
            ref={chatContainerRef}
            className="flex flex-col space-y-4 h-64 sm:h-80 overflow-y-auto p-3 mb-4 scrollbar-hide"
          >
            {displayedMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${message.sender === "user"
                      ? "bg-lime-500 text-white text-left"
                      : "bg-gray-100 borde text-left text-gray-800"
                    }`}
                >
                  <div className="flex items-center mb-1">
                    <span className={`text-xs font-medium ${message.sender === "user" ? "text-lime-100" : "text-gray-500"}`}>
                      {message.sender === "user" 
                        ? "You" 
                        : `${aiModels[message.level].name} (${message.level})`}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.text}
                    {isLoading && index === displayedMessages.length - 1 && message.sender === "ai" && (
                      <span className="inline-block w-2 h-4 ml-1 bg-lime-500 animate-pulse"></span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && displayedMessages[displayedMessages.length - 1]?.sender === "user" && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 max-w-[85%]">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{currentModel.avatar}</span>
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center border-2 border-gray-300 rounded-lg px-3 py-2 bg-white">
            <input
              type="text"
              placeholder={`Ask ${currentModel.name} a question...`}
              className="flex-grow px-2 py-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleSearch}
              className="text-lime-500 hover:text-lime-700 p-1.5 transition-colors"
              disabled={isLoading}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="max-w-2xl text-center">
        <p className="text-gray-700 text-lg mb-1">
          Selected level: <span className="font-medium text-lime-600 capitalize">{activeLevel}</span>
        </p>
        <p className="text-gray-600 text-sm">
          The assistant will tailor responses based on your selected knowledge level
        </p>
      </div>
    </div>
  );
}