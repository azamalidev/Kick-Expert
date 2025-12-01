import { Suspense } from 'react';
import CreditManagement from '@/components/CreditManagement';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CreditsPage() {
  return (
    <div className="bg-gray-50">
      <Navbar />
      <div className="min-h-screen">
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600"></div>
          </div>
        }>
          <CreditManagement />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
