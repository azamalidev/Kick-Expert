'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import toast from 'react-hot-toast';
import Link from "next/link";
import ReactCountryFlag from "react-country-flag";

const countries = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "BG", name: "Bulgaria" },
  { code: "KH", name: "Cambodia" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KW", name: "Kuwait" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" }
];

export default function CompleteProfile() {
  const [userName, setUserName] = useState<string>("");
  const [nationality, setNationality] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  // saved state removed: we auto-redirect on successful completion
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Set page title
    document.title = "KickExpert - Complete Your Profile";
  }, []);

  useEffect(() => {
    // Get current user and check if they need to complete profile
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!session?.user) {
          // If we have a verified email param, let the user complete profile without session
          const params = new URLSearchParams(window.location.search);
          const verified = params.get('verified');
          const email = params.get('email');
          if (verified === '1' && email) {
            // fetch prefill data from server
            try {
              const r = await fetch(`/api/profile/prefill?email=${encodeURIComponent(email)}`);
              if (r.ok) {
                const json = await r.json();
                setUser({ id: null, email: json.email });
                if (json.name) {
                  setUserName(json.name);
                } else {
                  setUserName("User");
                }
                // do not navigate to login — allow completion flow
              } else {
                router.push('/login');
                return;
              }
            } catch (e) {
              console.error('prefill fetch failed', e);
              router.push('/login');
              return;
            }
          } else {
            router.push('/login');
            return;
          }
        } else {
          setUser(session.user);

          // Get the name from signup data
          const sessUser = session.user;
          const userMetadata = sessUser?.user_metadata;
          if (userMetadata?.name) {
            setUserName(userMetadata.name);
          } else {
            // Fallback: try to get from users table
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('id', sessUser?.id)
              .single();
            
            if (userData?.name) {
              setUserName(userData.name);
            } else {
              setUserName("User");
            }
          }

          // Check if user already has a profile
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', sessUser?.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error loading profile:', profileError);
          }

          // If profile exists and appears complete, send user to dashboard.
          // Otherwise, prefill fields from any partial profile and allow completion here.
          if (existingProfile) {
            const hasUsername = !!existingProfile.username;
            const hasAvatar = !!existingProfile.avatar_url;
            const hasNationality = !!existingProfile.nationality;

            if (hasUsername && hasAvatar && hasNationality) {
              // Profile appears complete — redirect to dashboard
              router.replace('/');
              return;
            }

            // Prefill any available fields so the user can complete missing pieces
            if (existingProfile.username) setUserName(existingProfile.username);
            if (existingProfile.avatar_url) setAvatarPreview(existingProfile.avatar_url);
            if (existingProfile.nationality) setNationality(existingProfile.nationality);
          }

        }

      } catch (error: any) {
        console.error('Error checking user:', error);
        toast.error('Error loading user data');
        router.push('/login');
      }
    };

    checkUser();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (userId: string): Promise<string> => {
    if (!avatarFile) throw new Error('No image file selected');

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profileimages')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profileimages')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const validateForm = () => {
    if (!nationality) {
      toast.error('Please select your nationality');
      return false;
    }
    if (!avatarFile) {
      toast.error('Please upload a profile picture');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setLoading(true);
    const toastId = toast.loading('Setting up your profile...');

    try {
      // If we have a real signed-in user, use the client-side upload flow
      if (user?.id) {
        // Upload image first
        setUploadProgress(0);
        const avatarUrl = await uploadImage(user.id);

        // Upsert profile data (handles partial existing rows created by auth triggers)
        const profilePayload = {
          user_id: user.id,
          username: userName.trim() || null,
          avatar_url: avatarUrl || null,
          nationality: nationality || null,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const { data: upserted, error: upsertError } = await supabase
          .from('profiles')
          .upsert([profilePayload], { onConflict: 'user_id' })
          .select()
          .single();

        if (upsertError) throw upsertError;

        toast.success('Profile saved!', { id: toastId });

        // Redirect to dashboard after successful save
        router.replace('/');
      } else {
        // No session case: post form (including avatar file) to server endpoint
        const form = new FormData();
        form.append('email', user.email || '');
        form.append('username', userName.trim() || '');
        form.append('nationality', nationality || '');
        if (avatarFile) form.append('avatar', avatarFile);

        const r = await fetch('/api/profile/complete', { method: 'POST', body: form });
        if (!r.ok) throw new Error('Server profile completion failed');

        // After successful profile completion, auto-login the user
        try {
          const storedEmail = sessionStorage.getItem('signup_email');
          const storedPassword = sessionStorage.getItem('signup_password');

          if (storedEmail && storedPassword) {
            console.log('Attempting auto-login after profile completion...');

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
              email: storedEmail,
              password: storedPassword
            });

            if (authError) {
              console.error('Auto-login failed:', authError);
              toast.error('Profile completed but login failed. Please sign in manually.', { id: toastId });
              router.replace(`/login?email=${encodeURIComponent(storedEmail)}`);
              return;
            }

            if (authData?.session) {
              // Successfully logged in - clear stored credentials
              sessionStorage.removeItem('signup_email');
              sessionStorage.removeItem('signup_password');

              toast.success('Profile completed and logged in successfully! Welcome to KickExpert!', { id: toastId });

              // Redirect to dashboard with full page reload to ensure session is picked up
              setTimeout(() => {
                window.location.href = '/';
              }, 1500);
              return;
            }
          }

          // If no stored credentials or login failed, redirect to login
          toast.success('Profile completed! Please sign in to continue.', { id: toastId });
          router.replace('/login');

        } catch (autoLoginError) {
          console.error('Auto-login error:', autoLoginError);
          toast.error('Profile completed but automatic login failed. Please sign in manually.', { id: toastId });
          router.replace('/login');
        }
      }
    } catch (error: any) {
      console.error('Profile setup error:', error);
      let errorMessage = 'Profile setup failed. Please try again.';

      if (error.message?.includes('duplicate key')) {
        errorMessage = 'Username already exists. Please choose a different one.';
      } else if (error.message?.includes('storage')) {
        errorMessage = 'Image upload failed. Please try a different image.';
      }

      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Get country code from country name
  const getCountryCode = (countryName: string): string => {
    const country = countries.find(c => c.name === countryName);
    return country ? country.code : "";
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Image */}
      <div className="hidden lg:flex w-1/2 relative">
        <div className="fixed top-0 left-0 w-1/2 h-full overflow-hidden">
          <Image
            src="/images/slide1.jpg"
            alt="Complete Profile Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
          <div className="absolute bottom-10 left-0 right-0">
            <div className="max-w-md mx-auto text-center text-white px-4">
              <h2 className="text-3xl font-bold mb-2">Complete Your Profile</h2>
              <p className="text-lg">Add your details to get started with KickExpert</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            {/* Logo */}
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
              <h1 className="text-2xl font-bold text-gray-800">Complete Your Profile</h1>
              <p className="text-gray-600 mt-2">Add your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Display (Read-only) */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold mb-2 text-gray-600 uppercase">
                  Name
                </label>
                <input
                  id="username"
                  type="text"
                  value={userName}
                  readOnly
                  disabled
                  className="w-full px-5 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 cursor-not-allowed opacity-75"
                  placeholder="Loading..."
                />
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-600 uppercase">
                  Profile Picture *
                </label>
                <div className="flex items-center space-x-4">
                  <div
                    onClick={triggerFileInput}
                    className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-lime-400 hover:bg-lime-50 transition duration-200"
                  >
                    {avatarPreview ? (
                      <div className="w-full h-full rounded-xl overflow-hidden relative">
                        <Image
                          src={avatarPreview}
                          alt="Avatar Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition duration-200 disabled:opacity-50"
                    >
                      Choose Image
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG</p>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-lime-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Uploading: {Math.round(uploadProgress)}%</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Nationality Dropdown with Flags */}
              <div>
                <label htmlFor="nationality" className="block text-sm font-semibold mb-2 text-gray-600 uppercase">
                  Nationality
                </label>
                <select
                  id="nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 transition duration-200 disabled:opacity-50"
                >
                  <option value="">Select your country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                
                {/* Selected Country Flag Preview */}
                {nationality && (
                  <div className="mt-2 flex items-center">
                    <ReactCountryFlag
                      countryCode={getCountryCode(nationality)}
                      svg
                      style={{
                        width: '24px',
                        height: '24px',
                        marginRight: '8px',
                        borderRadius: '2px'
                      }}
                      title={nationality}
                    />
                    <span className="text-sm text-gray-600">Selected: {nationality}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin mr-2 h-5 w-5 text-white"
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
                    Setting up...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Complete Setup
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Please upload your profile picture and select your nationality to complete setup
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}