import CreditManagement from '@/components/CreditManagement';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-gray-50 ">    
        <Navbar/>
      <CreditManagement />
      <Footer/>
    </div>
  );
}
