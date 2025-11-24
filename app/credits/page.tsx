import CreditManagement from '@/components/CreditManagement';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CreditsPage() {
  return (
    <div className="bg-gray-50">
      <Navbar />
      <div className="min-h-screen">
        <CreditManagement />
      </div>
      <Footer />
    </div>
  );
}
