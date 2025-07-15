'use client';
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import UpdateProfile from "@/components/UpdateProfile";

export default function updateprofile() {
  return (
    <div >
    <Navbar/>
    <div className="mt-10">
      <UpdateProfile /></div>
      <Footer/>
    </div>
  );
}