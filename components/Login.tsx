'use client';

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import toast from 'react-hot-toast';
import Link from "next/link";
import { 
  getBrowserFingerprint, 
  getDeviceInfo, 
  getIPAddress, 
  saveBrowserFingerprint,
  checkActiveSession,
  handleForceLogin
} from '@/utils/fingerprint';
import DeviceSwitchModal from './DeviceSwitchModal';

// Resolve auth callback URL: prefer NEXT_PUBLIC_SITE_URL, fallback to window origin
const getAuthCallbackUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  if (typeof window !== 'undefined') return `${window.location.origin}/auth/callback`;
  return '/auth/callback';
};

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showVerificationScreen, setShowVerificationScreen] = useState<boolean>(false);
  const [verificationEmail, setVerificationEmail] = useState<string>("");
  const [showDeviceModal, setShowDeviceModal] = useState<boolean>(false);
  const [existingSessionData, setExistingSessionData] = useState<any>(null);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [deviceSwitchLoading, setDeviceSwitchLoading] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle email confirmation from URL parameters
  useEffect(() => {
    const handleAuthCallback = async () => {
      const confirmed = searchParams ? searchParams.get('confirmed') : null;
      if (confirmed === 'true') {
        toast.success('Email confirmed successfully! Please login.');
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ email_confirmed: true })
            .eq('id', session.user.id);

          if (updateError) {
            console.error('Update error:', updateError);
            toast.error('Failed to update email confirmation status.');
            return;
          }

          await supabase.auth.signOut();
          toast.success('Email confirmed successfully! Please login.');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        toast.error('Email confirmation failed. Please try again.');
      }
    };

    handleAuthCallback();
  }, [searchParams]);

  // Check if we should show verification screen from query params
  useEffect(() => {
    const verify = searchParams ? searchParams.get('verify') : null;
    const emailParam = searchParams ? searchParams.get('email') : null;
    
    if (verify === 'true' && emailParam) {
      setShowVerificationScreen(true);
      setVerificationEmail(emailParam as string);
    }
  }, [searchParams]);

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

  // Complete login flow with fingerprint and navigation
  const completeLoginFlow = async (user: any, userData: any, role: string, toastId?: string) => {
    try {
      // Save browser fingerprint for device tracking
      const fingerprintData = await getBrowserFingerprint();
      if (fingerprintData) {
        const deviceInfo = getDeviceInfo();
        const ipAddress = await getIPAddress();
        
        // Use "global_login" as competition_id for app-wide tracking
        await saveBrowserFingerprint(
          'global_login',
          user.id,
          fingerprintData.fingerprintId,
          deviceInfo,
          ipAddress
        );
        
        console.log('✅ Device fingerprint saved:', fingerprintData.fingerprintId);
      }

      if (toastId) {
        toast.success('Logged in successfully!', { id: toastId });
      } else {
        toast.success('Logged in successfully!');
      }

      setTimeout(() => {
        const targetRoute = role === "admin" ? "/admindashboard" : "/";
        console.log(`Navigating to: ${targetRoute}`);
        router.replace(targetRoute);
      }, 1500);
    } catch (fpError) {
      console.warn('Could not save fingerprint (non-critical):', fpError);
      // Continue navigation even if fingerprint fails
      if (toastId) {
        toast.success('Logged in successfully!', { id: toastId });
      } else {
        toast.success('Logged in successfully!');
      }
      
      setTimeout(() => {
        const targetRoute = role === "admin" ? "/admindashboard" : "/";
        router.replace(targetRoute);
      }, 1500);
    }
  };

  // Handle force login (Login Anyway)
  const handleLoginAnyway = async () => {
    if (!pendingUserData) return;
    
    setDeviceSwitchLoading(true);
    const toastId = toast.loading('Switching devices...');

    try {
      const { user, userData, role } = pendingUserData;

      // Get new fingerprint
      const fingerprintData = await getBrowserFingerprint();
      if (!fingerprintData) {
        throw new Error('Could not generate device fingerprint');
      }

      const deviceInfo = getDeviceInfo();

      // Force login - deactivates old sessions and creates new one
      const result = await handleForceLogin(
        user.id,
        fingerprintData.fingerprintId,
        deviceInfo,
        'global_login'
      );

      if (!result.success) {
        throw new Error('Failed to create new session');
      }

      console.log('✅ Forced login successful, old sessions deactivated');

      // Close modal
      setShowDeviceModal(false);
      setPendingUserData(null);
      setExistingSessionData(null);
      setDeviceSwitchLoading(false);

      // Complete login flow
      await completeLoginFlow(user, userData, role, toastId);
    } catch (error: any) {
      console.error('Force login error:', error);
      setDeviceSwitchLoading(false);
      toast.error('Failed to switch devices. Please try again.', { id: toastId });
    }
  };

  // Handle modal cancel
  const handleCancelDeviceSwitch = async () => {
    setShowDeviceModal(false);
    setPendingUserData(null);
    setExistingSessionData(null);
    
    // Sign out the current attempt
    await supabase.auth.signOut();
    toast('Login cancelled. Your other session remains active.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Logging in...');

    try {
      const { data: { user, session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error('User authentication failed');
      }

      if (!user.email_confirmed_at) {
        await supabase.auth.signOut();
        
        // Show verification screen instead of throwing error
        setShowVerificationScreen(true);
        setVerificationEmail(email);
        throw { code: 'email_not_confirmed' };
      }

      console.log("Authenticated user:", { id: user.id, email: user.email });

      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbError || !userData) {
        console.error("User document not found in Supabase for ID:", user.id);
        throw new Error("User profile not found. Please contact support.");
      }

      if (!userData.email_confirmed) {
        await supabase
          .from('users')
          .update({ email_confirmed: true })
          .eq('id', user.id);
      }

      const role = userData.role || 'user';
      console.log("User data from Supabase:", { ...userData, role });

      // 🔒 Check for existing active session before saving fingerprint
      const { hasActiveSession, sessionData } = await checkActiveSession(user.id);
      
      if (hasActiveSession && sessionData) {
        console.log('🔔 Active session detected:', sessionData);
        
        // Store pending data for device switch modal
        setPendingUserData({ user, userData, role });
        setExistingSessionData(sessionData);
        setShowDeviceModal(true);
        setLoading(false);
        toast.dismiss(toastId);
        return; // Wait for user decision
      }

      // No active session, proceed with normal login flow
      await completeLoginFlow(user, userData, role, toastId);
    } catch (error: any) {
      console.error("Login Error:", error.code, error.message);
      let errorMessage: any = 'Login failed. Please try again.';
      switch (error.code || error.message) {
        case 'invalid_credentials':
          errorMessage = 'Incorrect email or password.';
          break;
        case 'user_not_found':
          errorMessage = 'No account found with this email.';
          break;
        case 'too_many_requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'email_not_confirmed':
          // Don't show error toast as we're showing the verification screen
          errorMessage = null;
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      if (errorMessage) {
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const toastId = toast.loading('Sending verification email...');
    
    try {
      const r = await fetch('/api/auth/resend', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email: verificationEmail }) 
      });
      if (!r.ok) throw new Error('Resend failed');
      
      toast.success('Verification email sent! Please check your inbox.', { id: toastId });
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error('Failed to send verification email. Please try again.', { id: toastId });
    }
  };

  // Email verification screen
  if (showVerificationScreen) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-lime-50 to-gray-100">
        {/* Left side - Image */}
        <div className="hidden lg:flex w-1/2 relative">
          <div className="fixed top-0 left-0 w-1/2 h-full overflow-hidden">
            <Image
              src="/images/slide1.jpg"
              alt="Verification Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
            <div className="absolute bottom-10 left-0 right-0">
              <div className="max-w-md mx-auto text-center text-white px-4">
                <h2 className="text-3xl font-bold mb-2">Almost There!</h2>
                <p className="text-lg">Just one more step to join KickExpert</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Verification Form */}
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

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-lime-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Verify Your Email
                </h1>
                <p className="text-gray-600 text-sm">
                  We've sent a verification email to
                </p>
                <p className="text-lime-600 font-semibold mt-2 break-words">
                  {verificationEmail}
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 text-center">
                    Please check your email and click the verification link to activate your account.
                  </p>
                </div>

                <button
                  onClick={handleResendVerification}
                  className="w-full py-3 px-4 bg-lime-600 hover:bg-lime-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Resend Verification Email
                </button>

                <button
                  onClick={() => {
                    setShowVerificationScreen(false);
                    setVerificationEmail("");
                  }}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular login screen
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-lime-50 to-gray-100">
      {/* Left side - Image */}
      <div className="hidden lg:flex w-1/2 relative">
        <div className="fixed top-0 left-0 w-1/2 h-full overflow-hidden">
          <Image
            src="/images/slide1.jpg"
            alt="Login Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-md mx-auto text-center text-white px-4">
              <h2 className="text-3xl font-bold mb-2">Welcome to KickExpert</h2>
              <p className="text-lg">Your ultimate football knowledge destination</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
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
              <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
              <p className="text-gray-600 mt-2">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 mt-6">
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
                className={`w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    Logging in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Log In</span>
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

      {/* Device Switch Modal */}
      <DeviceSwitchModal
        isOpen={showDeviceModal}
        deviceInfo={existingSessionData?.device_info || {}}
        onCancel={handleCancelDeviceSwitch}
        onLoginAnyway={handleLoginAnyway}
        isLoading={deviceSwitchLoading}
      />
    </div>
  );
}