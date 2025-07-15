"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import LiveCompetition from "../components/CompetitionSection";
import ExploreHistory from "@/components/ExploreHistory";
import FootballExample from "@/components/FootballExample";
import FootballHistory from "@/components/FootballHistory";

import Records from "@/components/Records";
import FootballAssistant from "@/components/FootballAssistant";
import SportsArticle from "@/components/SportsArticle";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Home() {
  const pathname = usePathname();

  const scrollToSection = (sectionId: string) => {
    if (pathname !== "/") {
      window.location.href = `/#${sectionId}`;
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="bg-zinc-50 h-fit">
      <Navbar />
      <div className="relative w-full md:h-full bg-zinc-50">
        <div className="relative z-10 flex items-center justify-center h-full flex-col text-center px-4">
          <FootballExample />
        </div>
        {/* <div className="absolute inset-0 flex items-center md:flex">
          <Image
            src="/footbal.png"
            alt="Football"
            width={400}
            height={400}
            className="object-cover grayscale-[20%] opacity-70 brightness-110"
          />
        </div> */}
        <div className="absolute top-0 right-0 h-full hidden md:block">
          <Image
            src="/Decore.png"
            alt="Decore"
            width={450}
            height={600}
            className="object-contain grayscale-[20%]"
          />
        </div>
      </div>

      <FootballHistory />
      <div className="w-full" id="live-competition">
        <LiveCompetition />
      </div>
  
      <div className="w-full ">

        <FootballAssistant />
        <ExploreHistory />
        <Records />
      </div>

      <div className="w-full mt-10 md:mt-20"></div>
      <SportsArticle />

      <Footer />
    </section>
  );
}