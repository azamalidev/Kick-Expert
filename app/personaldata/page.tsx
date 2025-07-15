"use client";

import Image from "next/image";
import PersonalInfo from "@/components/PersonalInfo";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Policy() {
  return (
    <section className="bg-zinc-50 h-fit">
      <Navbar/>
       
<PersonalInfo/>

<Footer/>
    </section>
  );
}