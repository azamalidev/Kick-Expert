'use client';

import AdminLayout from '@/components/Admin/AdminLayout';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import Question from '@/components/Admin/Question';

export default function UsersPage() {
  return (
    <div className="mt-18 md:mt-14">
      <Toaster position="top-center" />
      <Navbar />
      <AdminLayout>
      
        <Question/>
      </AdminLayout>
    </div>
  );
}