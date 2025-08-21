import Footer from "@/components/Footer";
import League from "@/components/league";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";


export default function LoginPage() {
  return (
    <div>
      <Navbar/>
      <Suspense fallback={<div>Loading...</div>}>
        <League />
      </Suspense>
      <Footer/>
    </div>
  );
}
