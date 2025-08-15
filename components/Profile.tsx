'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from 'react-hot-toast';
import Image from "next/image";
import { QRCodeCanvas } from 'qrcode.react';
import { SupabaseUser, UserProfile } from '@/types/user';
import { TrophyService } from '@/utils/trophyService';
import { Trophy } from '@/types/trophy';
import { getRankFromXP, getNextRank, getProgressToNextRank } from '@/utils/rankSystem';

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
  const [totalWins, setTotalWins] = useState<number>(0);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [xp, setXp] = useState<number>(0);
  const [rankLabel, setRankLabel] = useState<string>("");
  const [userTrophies, setUserTrophies] = useState<Trophy[]>([]);
  const [loadingTrophies, setLoadingTrophies] = useState<boolean>(false);
  const [referralLink, setReferralLink] = useState<string>("");
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [referralRewards, setReferralRewards] = useState<any[]>([]);
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
          setUserProfile({
            user_id: user.id,
            username: userData.name || "",
            avatar_url: "",
            nationality: "",
            created_at: userData.created_at || ""
          });
        } else {
          const profile = profileData as any;
          setUserProfile(profile);
          setNationality(profile.nationality || "");
          setAvatarUrl(profile.avatar_url || "");
          setTotalWins(profile.total_wins || 0);
          setTotalGames(profile.total_games || 0);
          setXp(profile.xp || 0);
          setRankLabel(profile.rank_label || "Beginner");
          setUserProfile({ ...profile, username: profile.username || userData.name || "" });
        }

        await fetchUserTrophies(user.id);
        setReferralLink(`${window.location.origin}/signup?ref=${user.id}`);
        await fetchReferrals(user.id);
        await fetchReferralRewards(user.id);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const fetchUserTrophies = async (userId: string) => {
    setLoadingTrophies(true);
    try {
      const trophies = await TrophyService.getUserTrophies(userId);
      setUserTrophies(trophies);
    } catch (error) {
      console.error("Error fetching trophies:", error);
    } finally {
      setLoadingTrophies(false);
    }
  };

  const fetchReferrals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId);
      if (error) throw error;
      setReferredUsers(data || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("Failed to load referrals");
    }
  };

  const fetchReferralRewards = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      setReferralRewards(data || []);
    } catch (error) {
      console.error("Error fetching referral rewards:", error);
      toast.error("Failed to load referral rewards");
    }
  };

  const claimRewards = async (userId: string) => {
    const milestones = [
      { count: 3, reward_type: 'Starter Wallet Credit' },
      { count: 5, reward_type: 'Pro Wallet Credit' },
      { count: 10, reward_type: 'Elite Wallet Credit' },
    ];
    const effectiveCount = referredUsers.filter(r => r.email_confirmed && r.competition_joined).length;
    const existingMilestones = referralRewards.map(r => r.milestone);

    try {
      let rewardsClaimed = false;
      for (const milestone of milestones) {
        if (effectiveCount >= milestone.count && !existingMilestones.includes(milestone.count)) {
          const { error } = await supabase
            .from('referral_rewards')
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
              milestone: milestone.count,
              reward_type: milestone.reward_type,
              credited: false,
              created_at: new Date().toISOString(),
            });
          if (error) {
            if (error.code === '23505') {
              toast.error(`Reward for ${milestone.count} referrals already exists`);
              continue;
            }
            throw error;
          }
          rewardsClaimed = true;
        }
      }
      if (rewardsClaimed) {
        toast.success("New rewards added successfully!", { style: { background: '#D1FAE5', color: '#065F46' } });
      } else {
        toast("No new rewards available to add", { icon: 'ℹ️', style: { background: '#D1FAE5', color: '#065F46' } });
      }
      await fetchReferralRewards(userId);
    } catch (error: any) {
      console.error("Error adding rewards:", error);
      toast.error(error.message || "Failed to add rewards", { style: { background: '#D1FAE5', color: '#065F46' } });
    }
  };

  const claimIndividualReward = async (rewardId: string) => {
    try {
      const { error } = await supabase
        .from('referral_rewards')
        .update({ credited: true, updated_at: new Date().toISOString() })
        .eq('id', rewardId);
      if (error) throw error;
      toast.success("Reward claimed successfully!", { style: { background: '#D1FAE5', color: '#065F46' } });
      await fetchReferralRewards((await supabase.auth.getUser()).data.user!.id);
    } catch (error: any) {
      console.error("Error claiming reward:", error);
      toast.error(error.message || "Failed to claim reward", { style: { background: '#D1FAE5', color: '#065F46' } });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setAvatarFile(file);

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
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profileimages')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profileimages')
        .getPublicUrl(filePath);

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
      toast.error(error.message || "Failed to update avatar", { style: { background: '#D1FAE5', color: '#065F46' } });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty", { style: { background: '#D1FAE5', color: '#065F46' } });
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast.error("User not authenticated", { style: { background: '#D1FAE5', color: '#065F46' } });
      return;
    }

    try {
      const { error: userError } = await supabase
        .from('users')
        .update({ name: newName.trim() })
        .eq('id', user.id);

      if (userError) throw userError;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          username: newName.trim(),
          nationality: nationality,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      if (avatarFile) {
        await uploadAvatar();
      }

      setName(newName.trim());
      setUserProfile({ ...userProfile, username: newName.trim(), nationality } as UserProfile);
      setIsEditingProfile(false);
      toast.success("Profile updated successfully", { style: { background: '#D1FAE5', color: '#065F46' } });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", { style: { background: '#D1FAE5', color: '#065F46' } });
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields", { style: { background: '#D1FAE5', color: '#065F46' } });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match", { style: { background: '#D1FAE5', color: '#065F46' } });
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters", { style: { background: '#D1FAE5', color: '#065F46' } });
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Incorrect current password", { style: { background: '#D1FAE5', color: '#065F46' } });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully", { style: { background: '#D1FAE5', color: '#065F46' } });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error.message);
      toast.error(error.message || "Failed to update password", { style: { background: '#D1FAE5', color: '#065F46' } });
    }
  };

  const shareReferralToFacebook = () => {
    const text = encodeURIComponent(`Join me on this awesome platform and earn rewards! 🚀 Use my referral link: ${referralLink}`);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareReferralToX = () => {
    const text = encodeURIComponent(`Join me and earn rewards! 🚀 ${referralLink}`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareReferralToWhatsApp = () => {
    const text = encodeURIComponent(`Join me on this platform and earn rewards! 🚀 ${referralLink}`);
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareReferralToInstagram = async () => {
    const text = `Join me on this platform and earn rewards! 🚀 ${referralLink}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Referral link copied to clipboard! Paste it in Instagram to share.', { style: { background: '#D1FAE5', color: '#065F46' } });
    } catch (error) {
      toast.error('Failed to copy referral link', { style: { background: '#D1FAE5', color: '#065F46' } });
    }
  };

  const getReferralProgress = () => {
    const effectiveCount = referredUsers.filter(r => r.email_confirmed && r.competition_joined).length;
    const milestones = [3, 5, 10];
    const nextMilestone = milestones.find(m => effectiveCount < m) || 10;
    const progress = (effectiveCount / nextMilestone) * 100;
    return { effectiveCount, nextMilestone, progress };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#D1FAE5',
            color: '#065F46',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
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
            <div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
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
                      className="px-3 py-1.5 bg-lime-400 hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#D1FAE5] shadow-sm">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={name || "User"}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#D1FAE5] flex items-center justify-center">
                              <svg
                                className="w-10 h-10 text-[#10B981]"
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
                                className="w-5 h-5 text-[#10B981]"
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
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#10B981]"
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

                    <div className="flex-1 space-y-4">
                      {isEditingProfile ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1FAE5] focus:border-[#10B981]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                            <select
                              value={nationality}
                              onChange={(e) => setNationality(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1FAE5] focus:border-[#10B981]"
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
                            className="mt-4 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
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
                                className="w-4 h-4 mr-2 text-[#10B981]"
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
                                  className="w-4 h-4 mr-2 text-[#10B981]"
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
                                  className="w-4 h-4 mr-2 text-[#10B981]"
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

              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-[#10B981]"
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
                    <div className="bg-[#D1FAE5] p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-lime-400">Total Games</p>
                          <p className="text-2xl font-bold text-lime-400">{totalGames}</p>
                        </div>
                        <div className="p-2 bg-[#10B981] rounded-full">
                          <svg
                            className="w-5 h-5 text-white"
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

                    <div className="bg-[#D1FAE5] p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-lime-400">Total Wins</p>
                          <p className="text-2xl font-bold text-lime-400">{totalWins}</p>
                        </div>
                        <div className="p-2 bg-[#10B981] rounded-full">
                          <svg
                            className="w-5 h-5 text-white"
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

                    <div className="bg-[#D1FAE5] p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-lime-400">Win Rate</p>
                          <p className="text-2xl font-bold text-lime-400">
                            {totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0}%
                          </p>
                        </div>
                        <div className="p-2 bg-[#10B981] rounded-full">
                          <svg
                            className="w-5 h-5 text-white"
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

                    <div className="bg-[#D1FAE5] p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-lime-400">Experience</p>
                          <p className="text-2xl font-bold text-lime-400">{xp} XP</p>
                        </div>
                        <div className="p-2 bg-[#10B981] rounded-full">
                          <svg
                            className="w-5 h-5 text-white"
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

                  <div className="mt-4 bg-[#D1FAE5] p-4 rounded-lg border border-[#10B981]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`p-2 ${getRankFromXP(xp).bgColor} rounded-full mr-3`}>
                          <span className="text-xl">{getRankFromXP(xp).icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-lime-400">Current Rank</p>
                          <p className={`text-xl font-bold ${getRankFromXP(xp).color}`}>
                            {getRankFromXP(xp).label}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-lime-400">XP Progress</p>
                        <p className="text-lg font-bold text-lime-400">{xp} XP</p>
                      </div>
                    </div>

                    {(() => {
                      const nextRankInfo = getNextRank(xp);
                      if (nextRankInfo) {
                        const progress = getProgressToNextRank(xp);
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-lime-400">
                                Next: {nextRankInfo.nextRank.label}
                              </span>
                              <span className="text-xs text-lime-400">
                                {nextRankInfo.xpNeeded} XP needed
                              </span>
                            </div>
                            <div className="w-full bg-[#10B981]/20 rounded-full h-2">
                              <div
                                className="bg-[#10B981] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-center">
                            <span className="text-xs text-lime-400 font-medium">
                              🏆 Maximum Rank Achieved! 🏆
                            </span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-[#10B981]"
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
                    Trophies & Achievements
                    <span className="ml-2 bg-[#D1FAE5] text-lime-400 text-xs font-medium px-2 py-1 rounded-full">
                      {userTrophies.length}
                    </span>
                  </h3>

                  {loadingTrophies ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : userTrophies.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">🏆</div>
                      <p className="text-gray-500 text-sm">No trophies earned yet.</p>
                      <p className="text-gray-400 text-xs mt-1">Complete competitions to earn your first trophy!</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-[#D1FAE5] p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-lime-400">
                            {userTrophies.filter(t => t.trophy_type === 'bronze').length}
                          </div>
                          <div className="text-xs text-lime-400 font-medium flex items-center justify-center">
                            🥉 Bronze
                          </div>
                        </div>
                        <div className="bg-[#D1FAE5] p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-lime-400">
                            {userTrophies.filter(t => t.trophy_type === 'silver').length}
                          </div>
                          <div className="text-xs text-lime-400 font-medium flex items-center justify-center">
                            🥈 Silver
                          </div>
                        </div>
                        <div className="bg-[#D1FAE5] p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-lime-400">
                            {userTrophies.filter(t => t.trophy_type === 'gold').length}
                          </div>
                          <div className="text-xs text-lime-400 font-medium flex items-center justify-center">
                            🥇 Gold
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {userTrophies.map((trophy, index) => {
                          const colors = TrophyService.getTrophyColors(trophy.trophy_type);
                          return (
                            <div
                              key={trophy.id}
                              className={`${colors.bg} ${colors.border} border rounded-lg p-4 transition-all hover:shadow-md`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="text-3xl flex-shrink-0">
                                  {TrophyService.getTrophyIcon(trophy.trophy_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className={`font-semibold ${colors.text} text-lg leading-tight`}>
                                        {trophy.title}
                                      </h4>
                                      <p className={`${colors.text} opacity-80 text-sm mt-1`}>
                                        {trophy.description}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.accent} text-white`}>
                                        {trophy.trophy_type.charAt(0).toUpperCase() + trophy.trophy_type.slice(1)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center text-xs text-gray-500">
                                      <svg
                                        className="w-3 h-3 mr-1"
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
                                      Earned {TrophyService.formatTrophyDate(trophy.earned_at)}
                                    </div>
                                    <div className={`text-xs font-medium ${colors.text} opacity-70`}>
                                      #{index + 1}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {(() => {
                        const nextMilestone = TrophyService.getNextMilestone(xp);
                        if (nextMilestone) {
                          return (
                            <div className="mt-4 bg-[#D1FAE5] p-4 rounded-lg border border-[#10B981]">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-lime-400">Next Trophy</h5>
                                  <p className="text-lime-400 text-sm">{nextMilestone.title}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-lime-400">
                                    {nextMilestone.xpNeeded} XP
                                  </div>
                                  <div className="text-xs text-lime-400">needed</div>
                                </div>
                              </div>
                              <div className="mt-2 bg-[#10B981]/20 rounded-full h-2">
                                <div
                                  className="bg-[#10B981] h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, ((xp - (Math.floor(xp / 200) * 200)) / 200) * 100)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-[#10B981]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9a2 2 0 00-2-2H8a2 2 0 00-2 2m12 0v6a2 2 0 01-2 2H8a2 2 0 01-2-2V9m6 6v3m0 0l-3-3m3 3l3-3"
                      />
                    </svg>
                    🚀 Referral Program
                    <span className="ml-2 bg-[#D1FAE5] text-lime-400 text-xs font-medium px-2 py-1 rounded-full">
                      {referredUsers.length}
                    </span>
                  </h3>

                  <div className="mb-6 bg-[#D1FAE5] p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-lime-400 mb-2">Referral Progress</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-lime-400">
                        Referrals: {getReferralProgress().effectiveCount}
                      </span>
                      <span className="text-sm text-lime-400">
                        Next Milestone: {getReferralProgress().nextMilestone} referrals
                      </span>
                    </div>
                    <div className="w-full bg-[#10B981]/20 rounded-full h-2">
                      <div
                        className="bg-[#10B981] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getReferralProgress().progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-lime-400 mt-2">
                      Invite friends to earn XP and wallet credits! Wallet credits are non-withdrawable and for entry only.
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-lime-400 mb-1">Your Referral Link</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-[#10B981] rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#D1FAE5] focus:border-[#10B981]"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(referralLink);
                            toast.success('Referral link copied!', { style: { background: '#D1FAE5', color: '#065F46' } });
                          } catch (err) {
                            toast.error('Failed to copy', { style: { background: '#D1FAE5', color: '#065F46' } });
                          }
                        }}
                        className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-r-lg transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <QRCodeCanvas value={referralLink} size={128} bgColor="#D1FAE5" fgColor="#065F46" />
                    </div>
                    <p className="text-xs text-lime-400 mt-2 text-center">
                      Scan this QR code to share your referral link!
                    </p>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-lime-400 mb-2">Share Your Referral Link</h4>
                    <div className="flex space-x-3">
                      <button onClick={shareReferralToFacebook} title="Share on Facebook" className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                      </button>
                      <button onClick={shareReferralToX} title="Share on X" className="p-2 bg-black rounded-full hover:bg-gray-800 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </button>
                      <button onClick={shareReferralToWhatsApp} title="Share on WhatsApp" className="p-2 bg-[#25D366] rounded-full hover:bg-[#20BA56] transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448-2.207 1.526-4.874 2.589-7.7 2.654zm8.21-19.701c-2.207 0-4.003 1.796-4.003 4.003 0 .884.335 1.696.892 2.31l-.958 3.492 3.586-.926c.609.53 1.39.834 2.212.834 2.207 0 4.003-1.796 4.003-4.003 0-2.207-1.796-4.003-4.003-4.003zm3.04 6.373c.128.07.174.224.104.348-.047.083-.293.382-1.006 1.095-1.001 1-1.83 1.047-2.09 1.006-.26-.04-.858-.27-1.78-.942-.955-.694-1.602-1.562-1.795-1.826-.193-.265-.02-.405.138-.563.14-.14.279-.326.418-.512.093-.123.186-.247.279-.37.093-.123.047-.232-.027-.326-.07-.093-.232-.279-.418-.511-.14-.186-.279-.372-.372-.511-.093-.14-.14-.14-.232-.07-.093.07-.651.79-1.001 1.256-.186.248-.372.372-.511.372-.14 0-.418-.14-.744-.418-.326-.279-1.116-1.116-1.116-2.136 0-1.023.79-1.767 1.116-2.044.093-.07.186-.093.279-.093h.279c.093 0 .186 0 .232.14.047.14.186.372.511.977.093.186.186.372.232.511.047.14.07.232 0 .326-.07.093-.14.279-.186.418-.047.14-.07.279 0 .372.07.093.558.93 1.209 1.488.837.651 1.488.93 1.674 1.023.186.093.279.093.372-.047.093-.14.418-.558.558-.744.14-.186.279-.14.372-.093.093.047.651.325.977.511.326.186.558.279.651.325.093.047.14.07.14.186 0 .116-.07.279-.186.372z"/>
                        </svg>
                      </button>
                      <button onClick={shareReferralToInstagram} title="Share on Instagram" className="p-2 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full hover:brightness-105 transition">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.95.272.16 3.057 0 7.163 0 8.412 0 8.741 0 12c0 3.259 0 3.668 0 4.948 0 4.106 2.787 6.891 6.893 6.891 1.28 0 1.609 0 4.948 0 3.259 0 3.668 0 4.948 0 4.106 0 6.891-2.785 6.891-6.891 0-1.28 0-1.609 0-4.948 0-3.259 0-3.668 0-4.948 0-4.106-2.785-6.891-6.891-6.891-1.28 0-1.609 0-4.948 0-3.259 0-3.668 0-4.948 0zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <h4 className="text-lg font-semibold text-lime-400 mb-2">Referred Users</h4>
                  {referredUsers.length === 0 ? (
                    <p className="text-lime-400">No referred users yet.</p>
                  ) : (
                    <ul className="space-y-3 max-h-40 overflow-y-auto">
                      {referredUsers.map((ref) => (
                        <li key={ref.id} className="bg-[#D1FAE5] p-3 rounded-lg">
                          <p className="text-sm"><span className="font-medium text-lime-400">Referred ID:</span> {ref.referred_id}</p>
                          <p className="text-sm"><span className="font-medium text-lime-400">Email Confirmed:</span> {ref.email_confirmed ? 'Yes (+50 XP)' : 'No'}</p>
                          <p className="text-sm"><span className="font-medium text-lime-400">Competition Joined:</span> {ref.competition_joined ? 'Yes (+100 XP)' : 'No'}</p>
                          <p className="text-sm"><span className="font-medium text-lime-400">Created At:</span> {new Date(ref.created_at).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h4 className="text-lg font-semibold text-lime-400 mt-6 mb-2">Referral Rewards</h4>
                  {referralRewards.length === 0 ? (
                    <p className="text-lime-400">No rewards earned yet.</p>
                  ) : (
                    <ul className="space-y-3 max-h-40 overflow-y-auto">
                      {referralRewards.map((reward) => (
                        <li key={reward.id} className="bg-[#D1FAE5] p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="text-sm"><span className="font-medium text-lime-400">Milestone:</span> {reward.milestone} referrals</p>
                            <p className="text-sm"><span className="font-medium text-lime-400">Reward Type:</span> {reward.reward_type}</p>
                            <p className="text-sm"><span className="font-medium text-lime-400">Status:</span> {reward.credited ? 'Claimed' : 'Pending'}</p>
                            <p className="text-sm"><span className="font-medium text-lime-400">Created At:</span> {new Date(reward.created_at).toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => claimIndividualReward(reward.id)}
                            disabled={reward.credited}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                              reward.credited
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-[#10B981] hover:bg-[#059669] text-white'
                            }`}
                          >
                            {reward.credited ? 'Claimed' : 'Claim'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) await claimRewards(user.id);
                    }}
                    className="mt-6 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg transition-colors"
                  >
                    Check for New Rewards
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-red-500"
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
                    Password Security
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1FAE5] focus:border-[#10B981]"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1FAE5] focus:border-[#10B981]"
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1FAE5] focus:border-[#10B981]"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      className="w-full px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Account Settings
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        try {
                          await supabase.auth.signOut();
                          toast.success("Logged out successfully", { style: { background: '#D1FAE5', color: '#065F46' } });
                          router.push("/login");
                        } catch (error) {
                          toast.error("Failed to log out", { style: { background: '#D1FAE5', color: '#065F46' } });
                        }
                      }}
                      className="w-full px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}