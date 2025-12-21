"use client";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useState, useEffect } from "react";

import { articles } from "@/constants/articles";

const testimonials = [
  {
    id: 1,
    image: "/images/testimonial1.png",
    quote: "This site is a treasure trove for football fans! The history section is so detailed and engaging.",
    author: "Mike Taylor",
    location: "Lahore, Pakistan",
    reference: "Chris Thomas, Football Historian",
  },
  {
    id: 2,
    image: "/images/testimonial2.png",
    quote: "The football quizzes are challenging and fun! Perfect for any football enthusiast.",
    author: "Piaq Wilmos",
    location: "Warsaw, Poland",
    reference: "Otto Redford, Sports Blogger",
  },
  {
    id: 3,
    image: "/images/testimonial3.png",
    quote: "I love the in-depth articles about football's greatest moments. A must-visit for fans!",
    author: "Michael Brown",
    location: "New York, USA",
    reference: "Mark Williams, Football Analyst",
  },
];

export default function SportsArticleSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cardsPerPage = 6; // Show 6 articles (2 rows of 3)
  const totalCards = articles.length;
  const maxIndex = Math.max(0, totalCards - cardsPerPage); // Ensure maxIndex doesn't go negative

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handlePrev = () => {
    if (isTransitioning || currentIndex === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => Math.max(prev - cardsPerPage, 0)); // Move back by 6
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = () => {
    if (isTransitioning || currentIndex >= maxIndex) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => Math.min(prev + cardsPerPage, maxIndex)); // Move forward by 6
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const visibleArticles = articles.slice(currentIndex, currentIndex + cardsPerPage);

  const isLeftDisabled = currentIndex === 0;
  const isRightDisabled = currentIndex >= maxIndex;

  return (
    <section className="px-4 sm:px-10 py-10">
      <h2 className="text-2xl font-semibold mb-8 text-gray-900">Football Articles</h2>

      <div className="relative overflow-hidden">
        <div className={`grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 transition-transform duration-300 ease-in-out`}>
          {visibleArticles.map((item) => (
            <div key={item.id} className="space-y-4 group flex flex-col h-full">
              <div className="relative h-[270px] overflow-hidden rounded-lg flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 right-3 bg-black text-white text-xs px-3 py-1 rounded-full">
                  {item.category}
                </span>
              </div>

              <div className="flex flex-col flex-grow">
                <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                  <Image
                    src={item.authorImage}
                    alt={item.author}
                    width={24}
                    height={24}
                    className="rounded-full w-6 h-6 object-cover"
                  />
                  <span>{item.author}</span>
                  <span className="text-gray-500">{item.date}</span>
                </div>

                <h3 className="text-md font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">{item.desc}</p>

                <div className="mt-auto">
                  <Link
                    href={`/articleview/${item.id}`}
                    className="inline-block text-lime-600 hover:text-lime-700 font-medium text-sm transition-colors"
                  >
                    View More →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-4 justify-start">
        <button
          onClick={handlePrev}
          className={`bg-gray-200 hover:bg-gray-300 p-3 px-4 rounded transition-all duration-200 ${isLeftDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          disabled={isLeftDisabled}
        >
          <FaArrowLeft />
        </button>
        <button
          onClick={handleNext}
          className={`bg-lime-400 hover:bg-lime-500 text-white p-3 px-4 rounded transition-all duration-200 ${isRightDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          disabled={isRightDisabled}
        >
          <FaArrowRight />
        </button>
      </div>

      <div className="mt-16 px-4 sm:px-10 py-10 bg-zinc-50">
        <div className="text-left flex flex-col md:flex-row justify-between items-start w-full mx-auto max-w-6xl">
          <div className="flex flex-col items-start gap-5 w-full md:w-1/3">
            <p className="text-lime-500 text-xl font-bold">TESTIMONIALS</p>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">What People Say <br /> About Us.</h2>
            <div className="flex items-center mt-4 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${activeTestimonial === index ? 'bg-lime-500 w-6' : 'bg-gray-400'}`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 md:mt-0 w-full md:w-[55%] relative">
            <div className="relative overflow-hidden h-64">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${activeTestimonial === index ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
                >
                  <div className="relative bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300 h-full">
                    <div className="flex items-start h-full">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.author}
                        width={60}
                        height={60}
                        className="rounded-full mr-4 w-12 h-12 object-cover"
                      />
                      <div className="flex flex-col h-full">
                        <p className="text-gray-600 italic text-sm flex-grow">"{testimonial.quote}"</p>
                        <div>
                          <p className="text-gray-800 font-medium mt-2">{testimonial.author}</p>
                          <p className="text-gray-500 text-xs">{testimonial.location}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-gray-600 text-sm">{testimonial.reference}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
