'use client';

import { useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import toast, { Toaster } from 'react-hot-toast';
import Link from "next/link";
import { SupabaseUser } from '@/types/user';

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const validateForm = useCallback(() => {
    if (!email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!password) {
      toast.error('Password is required');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  }, [email, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Logging in...');

    try {
      // Sign in with Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error('User authentication failed');
      }

      console.log("Authenticated user:", { id: user.id, email: user.email });

      // Fetch user data from users table
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbError || !userData) {
        console.error("User document not found in Supabase for ID:", user.id);
        throw new Error("User profile not found. Please contact support.");
      }

      const role = userData.role || 'user';
      console.log("User data from Supabase:", { ...userData, role });

      toast.success('Logged in successfully!', { id: toastId });
      setTimeout(() => {
        const targetRoute = role === "admin" ? "/admindashboard" : "/";
        console.log(`Navigating to: ${targetRoute}`);
        router.replace(targetRoute);
      }, 1500);
    } catch (error: any) {
      console.error("Login Error:", error.code, error.message);
      let errorMessage = 'Login failed. Please try again.';
      switch (error.code) {
        case 'invalid_credentials':
          errorMessage = 'Incorrect email or password.';
          break;
        case 'user_not_found':
          errorMessage = 'No account found with this email.';
          break;
        case 'too_many_requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
          },
          loading: {
            duration: Infinity,
          },
        }}
      />

      {/* Image Section */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden h-[80vh] self-center">
        <div className="relative rounded-2xl w-full h-full">
          <Image
            src="/images/slide1.jpg"
            alt="Login Background"
            fill
            className="object-contain"
            priority
          />
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-md mx-auto text-center text-white">
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <p className="text-lg mb-4">Log in to access exclusive features</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 mr-4 bg-lime-100 rounded-full">
                <svg
                  className="w-6 h-6 text-lime-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Log In</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-600 uppercase">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2 text-gray-600 uppercase">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200"
                />
              </div>
              <div className="text-right">
                <Link
                  href="/forget"
                  className="text-sm text-lime-600 hover:text-lime-700 font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Log In
                {loading ? (
                  <svg
                    className="animate-spin ml-2 h-5 w-5 text-white inline"
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
                ) : (
                  <svg
                    className="w-5 h-5 ml-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="text-lime-600 hover:text-lime-700 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}