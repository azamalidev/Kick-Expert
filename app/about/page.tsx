"use client";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import AskQuestion from "@/components/About";
import Reviews from "@/components/Reviews";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function About() {
  return (
    <section className="bg-zinc-50 h-fit m-0 p-0 overflow-x-hidden">
      <Navbar/>
      {/* About Section */}
      <div className="w-full mt-16 p-0">
        <AskQuestion />
      </div>

      <div className="w-full px-4 md:px-16 my-10">
        <Swiper
          modules={[Navigation, Pagination]}
          navigation={{
            nextEl: ".custom-next",
            prevEl: ".custom-prev",
          }}
          pagination={{
            el: ".custom-pagination",
            clickable: true,
            renderBullet: (index, className) => {
              return `<span class="${className}">${index + 1}</span>`;
            },
          }}
          loop
          spaceBetween={30}
          slidesPerView={1}
          className="rounded-lg overflow-hidden"
        >
          <SwiperSlide>
            <Image
              src="/images/image.png"
              alt="Slide 1"
              width={1920}
              height={600}
              className="w-full h-auto object-cover rounded-lg"
            />
          </SwiperSlide>
          <SwiperSlide>
            <Image
              src="/images/image.png"
              alt="Slide 2"
              width={1920}
              height={600}
              className="w-full h-auto object-cover rounded-lg"
            />
          </SwiperSlide>
          <SwiperSlide>
            <Image
              src="/images/image.png"
              alt="Slide 3"
              width={1920}
              height={600}
              className="w-full h-auto object-cover rounded-lg"
            />
          </SwiperSlide>
        </Swiper>

        {/* Modern Pagination and Arrows - Bottom Position */}
        <div className="flex justify-between items-center mt-6">
          {/* Custom Pagination */}
          <div className="custom-pagination flex items-center gap-1" />
          
          {/* Arrows */}
          <div className="flex gap-3">
            <button className="custom-prev w-10 h-10 flex items-center justify-center bg-white text-lime-600 rounded-full shadow-md hover:bg-lime-600 hover:text-white transition-all duration-300 border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="custom-next w-10 h-10 flex items-center justify-center bg-white text-lime-600 rounded-full shadow-md hover:bg-lime-600 hover:text-white transition-all duration-300 border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Custom CSS for pagination */}
      <style jsx global>{`
        .swiper-pagination-bullet {
          width: 32px;
          height: 32px;
          text-align: center;
          line-height: 32px;
          font-size: 14px;
          font-weight: 600;
          color: #4ade80;
          opacity: 1;
          background: white;
          border: 1px solid #e5e7eb;
          margin: 0 4px !important;
          transition: all 0.3s ease;
          border-radius: 8px;
        }
        .swiper-pagination-bullet-active {
          color: white;
          background: #4ade80;
          border-color: #4ade80;
          transform: scale(1.05);
        }
      `}</style>

      {/* Reviews Section */}
      <div className="mt-20">
        <Reviews />
      </div>

      {/* Footer */}
      <Footer />
    </section>
  );
}