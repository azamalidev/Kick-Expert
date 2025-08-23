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
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [emailOptIn, setEmailOptIn] = useState<boolean>(true); // Default to true for better UX
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
    if (!dateOfBirth) {
      toast.error('Date of Birth is required');
      return false;
    }
    // Calculate age from date of birth
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 13) {
      toast.error('You must be at least 13 years old to sign up');
      return false;
    }
    if (!gender) {
      toast.error('Gender is required');
      return false;
    }
    if (!acceptTerms) {
      toast.error('You must accept the Terms of Service and Privacy Policy');
      return false;
    }
    return true;
  }, [name, email, password, dateOfBirth, gender, acceptTerms]);

 const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating your account...');

    try {
      // Get referral code from URL if exists
      const searchParams = new URLSearchParams(window.location.search);
      const referralCode = searchParams.get('ref');

      // First check if user exists in public.users table
      const { data: existingUser, error: lookupError } = await supabase
        .from('users')
        .select('id, email_confirmed')
        .eq('email', email)
        .maybeSingle();

      if (lookupError) throw lookupError;

      // If user exists but email isn't confirmed, resend confirmation
      if (existingUser) {
        if (existingUser.email_confirmed) {
          throw { code: 'user_already_exists' };
        } else {
          // Resend confirmation email without creating new user
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
          });

          if (resendError) throw resendError;

          toast.success('Confirmation email resent! Please check your inbox.', { id: toastId });
          return;
        }
      }

      // Proceed with new signup if user doesn't exist
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            referral_code: referralCode // Pass referral code to auth.users
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (authError) throw authError;
      if (!user) throw new Error('User creation failed');

      // Calculate age from date of birth
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Save user data to users table
      const userData: SupabaseUser = {
        id: user.id,
        email: user.email || email,
        name,
        role: 'user',
        created_at: new Date().toISOString(),
        email_confirmed: false,
        date_of_birth: dateOfBirth,
        age,
        gender,
        accepted_terms: acceptTerms,
        terms_accepted_at: new Date().toISOString(),
        email_opt_in: emailOptIn,
        email_opt_in_at: emailOptIn ? new Date().toISOString() : null
      };

      const { error: dbError } = await supabase
        .from('users')
        .insert([userData]);

      if (dbError) throw dbError;

      // Create profile entry (if you have a profiles table)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          username: name,
          date_of_birth: dateOfBirth,
          age,
          gender,
          email_opt_in: emailOptIn,
          updated_at: new Date().toISOString()
        });

      if (profileError) console.error('Profile creation error:', profileError);

      toast.success('Check your email for the confirmation link!', { id: toastId });
      
      // Redirect to verification screen
      setTimeout(() => {
        router.push(`/login?verify=true&email=${encodeURIComponent(email)}`);
      }, 2000);

    } catch (error: any) {
      console.error("Signup Error:", error.code, error.message);
      let errorMessage = 'Signup failed. Please try again.';
      switch (error.code) {
        case 'user_already_exists':
          errorMessage = 'This email is already registered. Please log in.';
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
        default:
          errorMessage = error.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-lime-50 to-gray-100">
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

      {/* Left side with image */}
      <div className="hidden lg:flex w-1/2 relative">
        <div className="fixed top-0 left-0 w-1/2 h-full overflow-hidden">
          <Image
            src="/images/slide1.jpg"
            alt="Signup Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-md mx-auto text-center text-white px-4">
              <h2 className="text-3xl font-bold mb-2">Join KickExpert</h2>
              <p className="text-lg">Your ultimate football knowledge destination</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side with form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
            {/* Logo inside the form */}
            <div className="flex justify-center mb-6">
              <Link href="/" className="flex items-center">
                <div className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="KickExpert Logo"
                    width={48}
                    height={48}
                    className="w-12 h-12"
                  />
                  <span className="ml-2 text-lime-500 font-bold text-2xl">
                    Kick<span className="text-gray-800">Expert</span>
                  </span>
                </div>
              </Link>
            </div>

            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
              <p className="text-gray-600 mt-2">Join our football community</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5 mt-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 text-gray-700 placeholder-gray-400 transition duration-200"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 text-gray-700 placeholder-gray-400 transition duration-200"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 text-gray-700 placeholder-gray-400 transition duration-200"
                />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-2 text-gray-700">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 text-gray-700 transition duration-200"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">You must be at least 13 years old</p>
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium mb-2 text-gray-700">
                  Gender
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 text-gray-700 transition duration-200"
                >
                  <option value="">Select your gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">For community analytics purposes</p>
              </div>
              
              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start mt-4">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    disabled={loading}
                    className="w-4 h-4 text-lime-600 bg-gray-100 border-gray-300 rounded focus:ring-lime-500 focus:ring-2"
                  />
                </div>
                <label htmlFor="terms" className="ms-2 text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-lime-600 hover:text-lime-700 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-lime-600 hover:text-lime-700 font-medium">
                    Privacy Policy
                  </Link>
                  <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Email Opt-In Checkbox */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="email-opt-in"
                    type="checkbox"
                    checked={emailOptIn}
                    onChange={(e) => setEmailOptIn(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 text-lime-600 bg-gray-100 border-gray-300 rounded focus:ring-lime-500 focus:ring-2"
                  />
                </div>
                <label htmlFor="email-opt-in" className="ms-2 text-sm text-gray-700">
                  I want to receive emails about new features, competitions, and football updates
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 bg-lime-500 hover:bg-lime-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-white mr-2"
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
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Sign Up</span>
                    <svg
                      className="w-5 h-5 ml-2"
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
                  </div>
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