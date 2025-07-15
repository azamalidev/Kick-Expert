"use client";

import Image from "next/image";
import PrivacyPolicy from "@/components/Policy";
import LegalInformation from "@/components/LegalInformation";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Policy() {
  return (
    <section className="bg-zinc-50 h-fit">
      <Navbar />
      <PrivacyPolicy />
      <LegalInformation />
      <Footer />
    </section>
  );
}