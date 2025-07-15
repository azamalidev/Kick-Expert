'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaRobot } from "react-icons/fa";
import { IoSend } from "react-icons/io5";

type Message = {
  text: string;
  sender: "user" | "ai";
  level: "easy" | "medium" | "hard";
};

type Level = "easy" | "medium" | "hard";

const AIModels = {
  easy: {
    name: "Football Beginner Bot",
    avatar: "👶",
    color: "bg-green-100",
    systemPrompt: `You are a friendly football assistant for beginners. Respond concisely in 1-2 sentences. 
      Provide only the essential fact or result. Avoid extra details, context, stats, or explanations. 
      Assume the user wants a fast, simple answer to a football-related question.`
  },
  medium: {
    name: "Football Analyst",
    avatar: "🧠",
    color: "bg-blue-100",
    systemPrompt: `You are a knowledgeable football analyst. Respond in 2-4 informative sentences. 
      Include the key fact and one additional insight such as a relevant stat, comparison, or brief historical background. 
      Keep the tone engaging and helpful without going into deep analysis.`
  },
  hard: {
    name: "Football Professor",
    avatar: "🏆",
    color: "bg-purple-100",
    systemPrompt: `You are a football expert with deep knowledge of the game. Respond in 4-6 sentences with expert-level insight. 
      Include the core fact, at least one advanced stat or tactical reference, and meaningful historical or contextual depth. 
      Optionally mention rare trivia, controversies, or player/coach quotes. Assume the user is a highly knowledgeable football fan.`
  }
};

export default function FootballAssistant() {
  const [activeLevel, setActiveLevel] = useState<Level>("medium");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [showChat, setShowChat] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateAIResponse = async (query: string, level: Level) => {
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
              content: AIModels[level].systemPrompt
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

  useEffect(() => {
    if (messages.length === 0 || messages.length === displayedMessages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender === "user") {
      setDisplayedMessages(messages);
      return;
    }

    let currentText = "";
    let i = 0;
    const typingSpeed = 20;

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

  const handleSendMessage = async () => {
    if (searchQuery.trim() === "" || isLoading) return;

    if (!showChat) {
      setShowChat(true);
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [displayedMessages]);

  useEffect(() => {
    if (showChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showChat]);

  const currentModel = AIModels[activeLevel];

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col w-full max-w-3xl rounded-xl items-center justify-center min-h-screen bg-gradient-to-b from-white via-green-100 to-lime-300 px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8 w-full">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 relative">
              <Image
                src="/images/image12.png"
                alt="Football Assistant Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 ml-3">Football Expert</h1>
          </div>
          <p className="text-gray-600 max-w-lg mx-auto">
            Ask me anything about football history. Choose your knowledge level for personalized responses.
          </p>
        </div>

        {/* Difficulty Selector */}
        <div className="flex justify-center gap-4 mb-8 w-full">
          {(["easy", "medium", "hard"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${
                activeLevel === level
                  ? `${AIModels[level].color} text-gray-800 font-semibold shadow-md`
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {AIModels[level].avatar} {AIModels[level].name}
            </button>
          ))}
        </div>

        {/* Chat Container - Only shown when there are messages */}
        {showChat && (
          <div 
            className={`w-full rounded-xl p-4 mb-6 transition-all duration-300 ${
              showChat ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div
              ref={chatContainerRef}
              className="h-64 overflow-y-auto p-3 mb-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="flex flex-col space-y-4">
                {displayedMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.sender === "user"
                          ? "bg-lime-500 text-white"
                          : `${AIModels[message.level].color} text-gray-800`
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                        {isLoading && 
                          index === displayedMessages.length - 1 && 
                          message.sender === "ai" && (
                            <span className="inline-block w-2 h-4 ml-1 bg-lime-500 animate-pulse"></span>
                          )}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && displayedMessages[displayedMessages.length - 1]?.sender === "user" && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <FaRobot className="text-gray-400" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="relative w-full">
          <div className="flex  items-center bg-white rounded-xl shadow-md border border-gray-200 px-4 py-3 w-full">
            <input
              ref={inputRef}
              type="text"
              placeholder={`Ask about football history (${activeLevel} level)...`}
              className="flex-grow outline-none bg-transparent text-gray-800 placeholder-gray-400 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="text-lime-500 hover:text-lime-600 transition-colors disabled:opacity-50"
            >
              <IoSend size={20} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center w-full">
          <p className="text-gray-500 mb-4">Want to explore more football history?</p>
          <div className="flex justify-center gap-4">
            <Link href={"/livecompetition"}>
              <button className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-2 rounded-full font-medium transition-colors">
                Live Competition
              </button>
            </Link>
            <Link href={"/quiz"}>
              <button className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-6 py-2 rounded-full font-medium transition-colors">
                Take Quiz
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}