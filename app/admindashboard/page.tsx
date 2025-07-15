'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../../components/Admin/AdminLayout';
import Navbar from '@/components/Navbar';
import { FiUsers, FiFileText, FiBarChart2, FiSettings, FiShield, FiHeadphones } from 'react-icons/fi';

export default function AdminDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      // Check if user is authenticated
      const { data: { user: authUser }, error: authError }: any = await supabase.auth.getUser();

      // if (!authUser || authError) {
      //   toast.error("Please log in to access the admin dashboard.");
      //   router.push("/login");
      //   return;
      // }

      try {
        // Fetch user data from public.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        // if (userError || !userData) {
        //   toast.error("User data not found.");
        //   router.push("/login");
        //   return;
        // }

        // Check if user has admin role
        if (userData.role !== 'admin') {
          toast.error("Access denied. Admins only.");
          router.push("/");
          return;
        }

        setUser(userData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error(`Failed to load user data. ${error}`);
       
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg
          className="animate-spin h-8 w-8 text-lime-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-gray-50 mt-16 min-h-screen">
      <Navbar />
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-2 max-w-7xl mx-auto">
          <div className="space-y-8">
            {/* Dashboard Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.name}! Here's what's happening today.</p>
            </div>

            {/* Admin Roles Section */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FiShield className="mr-2 text-indigo-500" />
                  Admin Roles
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <FiShield className="text-red-500 text-xl" />
                    <div>
                      <h3 className="font-medium text-gray-900">super_admin@example.com</h3>
                      <p className="text-sm text-gray-500">Super Admin</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <FiShield className="text-blue-500 text-xl" />
                    <div>
                      <h3 className="font-medium text-gray-900">admin@example.com</h3>
                      <p className="text-sm text-gray-500">Admin</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Management */}
              <div
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/admindashboard/users')}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                    <FiUsers className="text-xl" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl text-gray-900">User Management</h2>
                    <p className="text-gray-600">Manage user accounts and permissions</p>
                  </div>
                </div>
              </div>

              {/* Content Management */}
              <div
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/admindashboard/question')}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-full text-green-600">
                    <FiFileText className="text-xl" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl text-gray-900">Content Management</h2>
                    <p className="text-gray-600">Edit and manage website content</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
      <Toaster position="top-right" />
    </div>
  );
}