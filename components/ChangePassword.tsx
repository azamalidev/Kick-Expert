'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../lib/supabase/provider';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();
  const supabase = useSupabase();

  const validateForm = () => {
    if (!newPassword) {
      toast.error('New password required');
      return false;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be 6+ characters');
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Updating password...');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(`Failed to update password: ${error.message}`, { id: toastId });
    } else {
      toast.success('Password updated! Redirecting...', { id: toastId });
      setTimeout(() => router.push('/login'), 2000);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#363636', color: '#fff' },
          success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { duration: 4000 },
          loading: { duration: Infinity },
        }}
      />
      <div className="hidden lg:flex w-1/2 relative overflow-hidden h-[80vh] self-center">
        <div className="relative rounded-2xl w-full h-full">
          <Image
            src="/images/slide1.jpg"
            alt="Change Password Background"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain"
            priority
          />
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-md mx-auto text-center text-white">
              <h2 className="text-2xl font-bold">Change Your Password</h2>
              <p className="text-lg mb-4">Enter a new password to secure your account</p>
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
              <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-600 uppercase">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200"
                  placeholder="Enter new password"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-600 uppercase">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200"
                  placeholder="Confirm new password"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-white"
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
                    Updating...
                  </span>
                ) : (
                  <>
                    Update Password
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
                  </>
                )}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Return to{' '}
                <Link href="/login" className="text-lime-600 hover:text-lime-700 font-medium">
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
