'use client';

import { useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import toast, { Toaster } from 'react-hot-toast';
import Link from "next/link";
import { SupabaseUser } from '@/types/user';

export default function Signup() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const validateForm = useCallback(() => {
    if (!name.trim()) {
      toast.error('Full name is required');
      return false;
    }
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
  }, [name, email, password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating your account...');

    try {
      // Sign up with Supabase Auth
      const { data: { user, session }, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error('User creation failed');
      }

      console.log("Authenticated user:", { id: user.id, email: user.email });

      // Save user data to users table with default user role
      const userData: SupabaseUser = {
        id: user.id,
        email: user.email || email,
        name,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('users')
        .insert([userData]);

      if (dbError) {
        console.error("Database Error:", dbError);
        throw new Error(dbError.message || 'Failed to save user data');
      }

      console.log("User data saved to Supabase:", userData);

      // Ensure session is set (auto-login)
      if (!session) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) {
          throw loginError;
        }
      }

      toast.success('Account created and logged in successfully!', { id: toastId });
      setTimeout(() => {
        console.log(`Navigating to: /`);
        router.replace('/');
      }, 1500);
    } catch (error: any) {
      console.error("Signup Error:", error.code, error.message);
      let errorMessage = 'Signup failed. Please try again.';
      switch (error.code) {
        case 'user_already_exists':
          errorMessage = 'This email is already registered.';
          break;
        case 'invalid_email':
          errorMessage = 'Invalid email address.';
          break;
        case 'weak_password':
          errorMessage = 'Password is too weak.';
          break;
        case 'too_many_requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'email_not_confirmed':
          errorMessage = 'Email confirmation required. Please contact support.';
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

      <div className="hidden lg:flex w-1/2 relative overflow-hidden h-[80vh] self-center">
        <div className="relative rounded-2xl w-full h-full">
          <Image
            src="/images/slide1.jpg"
            alt="Signup Background"
            fill
            className="object-contain"
            priority
          />
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-md mx-auto text-center text-white">
              <h2 className="text-2xl font-bold">Join Our Community</h2>
              <p className="text-lg mb-4">Sign up today and unlock exclusive features</p>
            </div>
          </div>
        </div>
      </div>

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
              <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2 text-gray-600 uppercase">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200"
                />
              </div>
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
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Sign Up
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
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-lime-600 hover:text-lime-700 font-medium"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}