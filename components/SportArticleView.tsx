"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { articles } from "./SportsArticle";
import { useEffect, useRef, useState } from "react";

export default function SportArticleView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  
  // Find the article with the matching ID
  const article = articles.find(item => item.id.toString() === id);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Article not found</h1>
          <button 
            onClick={() => router.push('/')}
            className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // refs and state for dynamic split
  const imageWrapperRef = useRef<HTMLDivElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  const [isMd, setIsMd] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  const [splitIndex, setSplitIndex] = useState<number>(0);

  // compute how many paragraphs fit next to the image
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ro: ResizeObserver | null = null;

    const compute = () => {
      const imgH = imageWrapperRef.current?.clientHeight ?? 0;
      const rightW = rightColRef.current?.clientWidth ?? 0;

      // if small screen, show all paragraphs below
      if (window.innerWidth < 768 || imgH === 0 || !measureRef.current) {
        setIsMd(window.innerWidth >= 768);
        setSplitIndex(0);
        return;
      }

      setIsMd(true);

      // set measurement container width to right column width to match wrapping
      measureRef.current.style.width = `${rightW}px`;

      const children = Array.from(measureRef.current.children) as HTMLElement[];
      let cum = 0;
      let idx = 0;
      for (; idx < children.length; idx++) {
        const h = children[idx].offsetHeight;
        if (cum + h > imgH) break;
        cum += h;
      }

      setSplitIndex(idx);
    };

    // initial compute
    compute();

    // observe image wrapper size changes
    if (imageWrapperRef.current && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => compute());
      ro.observe(imageWrapperRef.current);
    }

    // listen for window resize
    const onResize = () => compute();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (ro && imageWrapperRef.current) ro.unobserve(imageWrapperRef.current);
      ro = null;
    };
  }, [article.paragraphs]);

  // derive visible and rest paragraphs
  const visibleParagraphs = isMd ? article.paragraphs.slice(0, splitIndex) : [];
  const restParagraphs = isMd ? article.paragraphs.slice(splitIndex) : article.paragraphs;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 min-h-screen">
      <div className="mb-8">
        <span className="bg-black text-white text-xs px-3 py-1 rounded-full">
          {article.category}
        </span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{article.title}</h1>
      
      <div className="flex items-center space-x-3 text-sm text-gray-600 mb-8">
        <Image
          src={article.authorImage}
          alt={article.author}
          width={24}
          height={24}
          className="rounded-full w-6 h-6 object-cover"
        />
        <span>{article.author}</span>
        <span className="text-gray-500">{article.date}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-12 items-start">
        <div className="w-full md:w-1/2">
          <div ref={imageWrapperRef} className="relative h-64 sm:h-80 md:h-[140vh] w-full overflow-hidden rounded-lg shadow-lg">
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
        <div ref={rightColRef} className="w-full md:w-1/2 flex flex-col justify-end space-y-8 md:min-h-[80vh]">
          {visibleParagraphs.map((para, index) => (
            <p
              key={index}
              className={`article-para relative text-gray-800 leading-relaxed text-lg tracking-normal max-w-prose pl-4
                before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-lime-400
                ${index === 0 ? "first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none" : ""}
              `}
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Hidden measurement container: used to measure wrapped paragraph heights for the right column width */}
      <div ref={measureRef} className="invisible absolute left-0 top-0 pointer-events-none w-0">
        {article.paragraphs.map((para, index) => (
          <p key={index} className={`article-para relative text-gray-800 leading-relaxed text-lg tracking-normal max-w-prose pl-4`}>{para}</p>
        ))}
      </div>

      {/* Render remaining paragraphs full-width below the image/columns */}
      {(() => {
        const sideCount = 3;
        const rest = article.paragraphs.slice(sideCount);
        if (rest.length === 0) return null;
        return (
            <div className="mt-8 -mx-4 sm:-mx-6">
              <div className="px-4 sm:px-6 space-y-8">
                {rest.map((para, index) => (
                  <p
                    key={index}
                    className={`relative text-gray-800 leading-relaxed text-lg tracking-normal max-w-none w-full pl-4 md:pl-8
                      before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-lime-400
                    `}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
        );
      })()}

      <div className="mt-12 border-t border-gray-200 pt-8">
        <div className="flex justify-end items-center">
          <button 
            onClick={() => router.back()}
            className="bg-lime-500 hover:bg-lime-400 px-6 py-2 rounded-md transition-colors flex items-center gap-2 text-white font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Articles
          </button>
        </div>
      </div>
    </div>
  );
}
