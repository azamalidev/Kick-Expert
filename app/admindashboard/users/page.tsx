'use client';

import AdminLayout from '@/components/Admin/AdminLayout';
import RegisteredUsers from '@/components/Admin/RegisteredUsers';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

export default function UsersPage() {
  return (
    <div className="mt-18 md:mt-14">
      <Toaster position="top-center" />
      <Navbar />
      <AdminLayout>
      
        <RegisteredUsers />
      </AdminLayout>
    </div>
  );
}