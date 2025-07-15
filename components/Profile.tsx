'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from 'react-hot-toast';
import Image from "next/image";
import { SupabaseUser } from '@/types/user';

export default function Profile() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const router = useRouter();

  const slides = [
    "/images/slide6.jpg",
    "/images/slide7.jpg",
    "/images/slide2.jpg",
    "/images/slide1.jpg",
    "/images/slide9.jpg",
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Please log in to view your profile");
        router.push("/login");
        return;
      }

      setEmail(user.email || "");
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error || !data) {
          console.error("Error fetching user data:", error);
          toast.error("Profile data not found");
          return;
        }

        const userData = data as SupabaseUser;
        setName(userData.name || "");
        setNewName(userData.name || "");
        setCreatedAt(userData.created_at || "");
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Slideshow interval
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [router, slides.length]);

  const handleNameSave = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ name: newName.trim() })
        .eq('id', user.id);

      if (error) {
        console.error("Error updating name:", error);
        throw new Error("Failed to update name");
      }

      setName(newName.trim());
      setIsEditingName(false);
      toast.success("Name updated successfully");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name");
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });

      if (signInError) {
        console.error("Error verifying current password:", signInError);
        toast.error("Incorrect current password");
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Error updating password:", error);
        throw new Error(error.message || "Failed to update password");
      }

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error.message);
      toast.error(error.message || "Failed to update password");
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

      {/* Image Slideshow Section */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden h-[80vh] self-center">
        <div className="relative rounded-2xl w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={slide}
                alt={`Slide ${index + 1}`}
                fill
                className="object-contain"
                priority={index === 0}
              />
            </div>
          ))}
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-md mx-auto text-center text-white">
              <h2 className="text-2xl font-bold">Your Profile</h2>
              <p className="text-lg mb-4">View and manage your account details</p>
            </div>
          </div>
          <div className="absolute bottom-5 left-0 right-0 flex justify-center space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentSlide ? 'bg-lime-400' : 'bg-white bg-opacity-50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Profile Details Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {loading ? (
            <div className="flex justify-center">
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
          ) : (
            <div className="space-y-8">
              {/* My Profile and Description */}
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
              </div>

              {/* Username with Edit Option */}
              <div>
                <div className="flex items-center">
                  {isEditingName ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200"
                      autoFocus
                    />
                  ) : (
                    <p className="flex-1 px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700">
                      {name}
                    </p>
                  )}
                  <button
                    onClick={isEditingName ? handleNameSave : () => setIsEditingName(true)}
                    className="ml-4 p-2 bg-lime-100 hover:bg-lime-200 rounded-full transition duration-200"
                  >
                    <svg
                      className="w-5 h-5 text-lime-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={isEditingName ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"}
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex items-center mb-8">
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
                  <h2 className="text-2xl font-bold text-gray-800">Password Security</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600 uppercase">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600 uppercase">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200"
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600 uppercase">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    className="w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                  >
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
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}