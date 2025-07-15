"use client";

import Image from "next/image";
import Map from "@/components/Map";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import Navbar from "@/components/Navbar";

export default function Contact() {
  return (
    <div className="relative bg-zinc-50  min-h-screen">
      <Navbar/>
      {/* Background Football Image - Fixed and behind content */}
      {/* <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <Image
          src="/footbal.png"
          alt="Football background"
          fill
          className="object-cover grayscale-[20%] brightness-110"
          priority
        />
      </div> */}

      {/* Main Content */}
      <main className="relative z-10">
        {/* Map Section */}
        <section className="pt-20 pb-10">
          <Map />
        </section>

        {/* FAQ Section */}
        <section className="py-10">
          <FAQSection />
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}