'use client';

import AdminLayout from '@/components/Admin/AdminLayout';
import Navbar from '@/components/Navbar';
import Notifications from '@/components/Admin/Notifications';

import { Toaster } from 'react-hot-toast';


export default function UsersPage() {
  return (
    <div className="mt-18 md:mt-14">
      <Toaster position="top-center" />
      <Navbar />
      <AdminLayout>
        <Notifications/>
      </AdminLayout>
    </div>
  );
}