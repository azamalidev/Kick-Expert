
'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
// import { auth, db } from "@/lib/firebase";
// import { doc, getDoc, setDoc } from "firebase/firestore";
// import { updateEmail, updateProfile } from "firebase/auth";
import toast, { Toaster } from 'react-hot-toast';
import Image from "next/image";

export default function UpdateProfile() {
  const [name, setName] = useState<string>("John Doe"); // Dummy name
  const [email, setEmail] = useState<string>("john.doe@example.com"); // Dummy email
  const [loading, setLoading] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const router = useRouter();

  const slides = [
    "/images/slide1.jpg",
    "/images/slide2.jpg",
    "/images/slide3.jpg",
    "/images/slide4.jpg",
    "/images/slide5.jpg",
  ];

  // Commented out Firebase data fetching
  useEffect(() => {
    // const fetchUserData = async () => {
    //   const user = auth.currentUser;
    //   if (user) {
    //     setEmail(user.email || "");
    //     try {
    //       const userDoc = await getDoc(doc(db, "users", user.uid));
    //       if (userDoc.exists()) {
    //         setName(userDoc.data().name || "");
    //       }
    //     } catch (error) {
    //       console.error("Error fetching user data:", error);
    //       toast.error("Failed to load profile data");
    //     }
    //   } else {
    //     toast.error("Please log in to update your profile");
    //     router.push("/login");
    //   }
    // };

    // fetchUserData();

    // Slideshow interval
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [router, slides.length]); // Fixed: Closed useEffect properly

  const validateForm = () => {
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
    return true;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Dummy user check
    const user = { uid: "dummy-uid", email: "john.doe@example.com" }; // Dummy user
    if (!user) {
      toast.error("No user is logged in");
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Updating your profile...');

    try {
      // Commented out Firebase Authentication and Firestore updates
      /*
      await updateProfile(user, { displayName: name });
      if (user.email !== email) {
        await updateEmail(user, email);
      }
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email,
        name: name,
        createdAt: new Date().toISOString(),
      }, { merge: true });
      */

      // Simulate successful update
      toast.success('Profile updated successfully!', { id: toastId });
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: any) {
      console.error("Update Profile Error:", error.message);
      toast.error(error.message || 'Profile update failed. Please try again.', { id: toastId });
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
          {/* Text Overlay Container */}
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-md mx-auto text-center text-white">
              <h2 className="text-2xl font-bold">Update Your Profile</h2>
              <p className="text-lg mb-4">Keep your information up to date</p>
            </div>
          </div>
          {/* Slide Indicators */}
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

      {/* Update Profile Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Update Profile</h1>
            <p className="text-gray-600">Modify your account details</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg transition duration-300 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Updating profile...
                </span>
              ) : (
                'Update Profile'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Return to{' '}
              <button
                onClick={() => router.push('/')}
                className="text-lime-600 hover:text-lime-700 font-bold"
              >
                Homepage
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

