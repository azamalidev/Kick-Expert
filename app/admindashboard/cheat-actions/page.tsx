'use client';

import AdminLayout from '@/components/Admin/AdminLayout';
import CheatActions from '@/components/Admin/CheatActions';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

export default function CheatActionsPage() {
  return (
    <div className="mt-18 md:mt-14">
      <Toaster position="top-center" />
      <Navbar />
      <AdminLayout>
        <CheatActions />
      </AdminLayout>
    </div>
  );
}
