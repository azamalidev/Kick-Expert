'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from 'react-hot-toast';
import Image from "next/image";
import { SupabaseUser, UserProfile } from '@/types/user';

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium", "Brazil", "Bulgaria",
  "Cambodia", "Canada", "Chile", "China", "Colombia", "Croatia", "Cyprus", "Czech Republic",
  "Denmark", "Ecuador", "Egypt", "Estonia", "Finland", "France", "Georgia", "Germany",
  "Ghana", "Greece", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia",
  "Lebanon", "Lithuania", "Luxembourg", "Malaysia", "Mexico", "Morocco", "Netherlands",
  "New Zealand", "Nigeria", "Norway", "Pakistan", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Singapore", "Slovakia",
  "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland",
  "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Venezuela", "Vietnam"
];

export default function Profile() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nationality, setNationality] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  // Additional profile stats (read-only)
  const [totalWins, setTotalWins] = useState<number>(0);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [xp, setXp] = useState<number>(0);
  const [rankLabel, setRankLabel] = useState<string>("");
  const router = useRouter();

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
        // Fetch user data from users table
        const { data, error } = await supabase
          .from('users')
          .select('name, created_at')
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

        // Fetch profile data including avatar and nationality
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url, nationality, username, total_wins, total_games, xp, rank_label')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile data:", profileError);
          setUserProfile(null);
          setNationality("");
          setAvatarUrl("");
          setTotalWins(0);
          setTotalGames(0);
          setXp(0);
          setRankLabel("");
          // If no profile exists, set username to name from users table
          setUserProfile({
            user_id: user.id,
            username: userData.name || "",
            avatar_url: "",
            nationality: "",
            created_at: userData.created_at || ""
          });
        } else {
          const profile = profileData as any; // Using any since we have additional fields
          setUserProfile(profile);
          setNationality(profile.nationality || "");
          setAvatarUrl(profile.avatar_url || "");
          setTotalWins(profile.total_wins || 0);
          setTotalGames(profile.total_games || 0);
          setXp(profile.xp || 0);
          setRankLabel(profile.rank_label || "Beginner");
          // Use username from profiles if available, otherwise fallback to name
          setUserProfile({ ...profile, username: profile.username || userData.name || "" });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setAvatarFile(file);

    // Preview the image
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;

    setIsUploading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`; // This can remain as a folder path within the bucket

      // Upload the file to the correct bucket
      const { error: uploadError } = await supabase.storage
        .from('profileimages') // Changed from 'avatars' to 'profileimages'
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profileimages') // Changed from 'avatars' to 'profileimages'
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);

    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Failed to update avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileSave = async () => {
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
      // Update name in users table
      const { error: userError } = await supabase
        .from('users')
        .update({ name: newName.trim() })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update profile in profiles table, setting username to match name
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          username: newName.trim(), // Sync username with name
          nationality: nationality,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Upload avatar if changed
      if (avatarFile) {
        await uploadAvatar();
      }

      setName(newName.trim());
      setUserProfile({ ...userProfile, username: newName.trim(), nationality } as UserProfile);
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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
        toast.error("Incorrect current password");
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

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
    <div className="min-h-screen bg-gray-50">
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
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Profile Info */}
            <div className="w-full lg:w-1/2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                    <button
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="px-3 py-1.5 bg-lime-500 hover:bg-lime-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar Section */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-lime-300 shadow-sm">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={name || "User"}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-lime-100 flex items-center justify-center">
                              <svg
                                className="w-10 h-10 text-lime-600"
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
                          )}
                        </div>
                        {isEditingProfile && (
                          <>
                            <label
                              htmlFor="avatar-upload"
                              className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md border border-gray-200 cursor-pointer hover:bg-gray-50"
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
                                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </label>
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                          </>
                        )}
                      </div>
                      {isUploading && (
                        <div className="mt-2 text-sm text-gray-500 flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-lime-500"
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
                          Uploading...
                        </div>
                      )}
                    </div>

                    {/* Profile Details */}
                    <div className="flex-1 space-y-4">
                      {isEditingProfile ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-100 focus:border-lime-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                            <select
                              value={nationality}
                              onChange={(e) => setNationality(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-100 focus:border-lime-400"
                            >
                              <option value="">Select your country</option>
                              {countries.map((country) => (
                                <option key={country} value={country}>
                                  {country}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={handleProfileSave}
                            disabled={isUploading}
                            className="mt-4 px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            Save Changes
                          </button>
                        </>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center text-gray-600">
                              <svg
                                className="w-4 h-4 mr-2 text-lime-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                />
                              </svg>
                              {email}
                            </div>
                            {nationality && (
                              <div className="flex items-center text-gray-600">
                                <svg
                                  className="w-4 h-4 mr-2 text-lime-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {nationality}
                              </div>
                            )}
                            {createdAt && (
                              <div className="flex items-center text-gray-600">
                                <svg
                                  className="w-4 h-4 mr-2 text-lime-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Member since {new Date(createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Incomplete Profile Notice */}
              {!userProfile?.username && !isEditingProfile && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <p className="text-yellow-800 font-medium text-sm">Complete Your Profile</p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Click "Edit Profile" to complete your profile setup.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Statistics Card */}
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-lime-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Game Statistics
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-lime-50 to-lime-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-lime-700">Total Games</p>
                          <p className="text-2xl font-bold text-lime-800">{totalGames}</p>
                        </div>
                        <div className="p-2 bg-lime-200 rounded-full">
                          <svg
                            className="w-5 h-5 text-lime-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700">Total Wins</p>
                          <p className="text-2xl font-bold text-green-800">{totalWins}</p>
                        </div>
                        <div className="p-2 bg-green-200 rounded-full">
                          <svg
                            className="w-5 h-5 text-green-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">Win Rate</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0}%
                          </p>
                        </div>
                        <div className="p-2 bg-blue-200 rounded-full">
                          <svg
                            className="w-5 h-5 text-blue-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-700">Experience</p>
                          <p className="text-2xl font-bold text-purple-800">{xp} XP</p>
                        </div>
                        <div className="p-2 bg-purple-200 rounded-full">
                          <svg
                            className="w-5 h-5 text-purple-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rank Display */}
                  {rankLabel && (
                    <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center">
                          <div className="p-2 bg-yellow-200 rounded-full mr-3">
                            <svg
                              className="w-6 h-6 text-yellow-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-yellow-700">Current Rank</p>
                            <p className="text-xl font-bold text-yellow-800">{rankLabel}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Password Security */}
            <div className="bg-white h-fit p-4 sm:p-6 md:p-8 rounded-2xl shadow-md border border-gray-100 w-full max-w-md lg:max-w-[calc(50%-1rem)]">
              <div className="flex items-center mb-6 sm:mb-8">
                <div className="p-2 sm:p-3 mr-3 sm:mr-4 bg-lime-100 rounded-full flex-shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-lime-600"
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
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Password Security</h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-600 uppercase">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 sm:px-5 py-2 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200 text-sm sm:text-base"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-600 uppercase">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 sm:px-5 py-2 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200 text-sm sm:text-base"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-600 uppercase">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 sm:px-5 py-2 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 text-gray-700 placeholder-gray-400 transition duration-200 text-sm sm:text-base"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  className="w-full py-2 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  Update Password
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 ml-2 inline"
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
  );
}