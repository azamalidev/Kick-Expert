import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SportArticleView from "@/components/SportArticleView";
import { Suspense } from "react";


export default function LoginPage() {
  return (
    <div className="">
        <Navbar/>
      <Suspense fallback={<div className="text-center py-20">Loading article...</div>}>
        <SportArticleView />
      </Suspense>
      <Footer/>
    </div>
  );
}
