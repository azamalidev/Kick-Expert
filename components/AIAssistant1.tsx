// components/ChatAssistant.js
import Image from "next/image";
import { FaPaperPlane } from "react-icons/fa";

export default function ChatAssistant() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 py-12">
      {/* Main Card */}
      <div className="relative w-full max-w-4xl rounded-2xl shadow-lg bg-gradient-to-b from-white via-green-100 to-lime-300 p-6 sm:p-10">
        {/* Ball Image (faded background right) */}
       

        {/* Icon + Heading */}
        <div className="flex flex-col items-center text-center mb-8 z-10 relative">
          <div className="text-lime-500 text-3xl">✨</div>
          <p className="text-gray-800 mt-4 text-lg sm:text-xl max-w-xl">
            Ask me anything about international football history. Choose your difficulty level for personalized responses.
          </p>
        </div>

        {/* Chat Bubbles */}
        <div className="flex flex-col space-y-4 mb-6 z-10 relative">
          {/* User bubble */}
          <div className="flex items-start space-x-2">
            <span className="text-xs bg-green-100 text-gray-800 px-2 py-1 rounded-full">ME</span>
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm shadow-sm">
              What can I ask you to do?
            </div>
          </div>
          {/* AI bubble */}
          <div className="flex items-start space-x-2">
            <span className="text-xs bg-lime-500 text-white px-2 py-1 rounded-full">AI</span>
            <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-sm">
              What can I ask you to do?
            </div>
          </div>
        </div>

        {/* Input and Send Button */}
        <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white z-10 relative">
          <input
            type="text"
            placeholder="Ask me anything about your projects"
            className="flex-grow px-4 py-2 outline-none bg-transparent"
          />
          <button className="text-lime-500 hover:text-lime-700 p-2">
            <FaPaperPlane size={18} />
          </button>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
        <button className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-2 rounded-md text-sm font-medium">
          OPEN FULL CHAT INTERFACE
        </button>
        <button className="border border-gray-400 text-gray-800 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-100">
          TAKE A QUIZ
        </button>
      </div>
    </div>
  );
}
