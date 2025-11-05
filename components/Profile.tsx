'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from 'react-hot-toast';
import Image from "next/image";
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { SupabaseUser, UserProfile } from '@/types/user';
import { TrophyService } from '@/utils/trophyService';
import { Trophy } from '@/types/trophy';
import { getRankFromXP, getNextRank, getProgressToNextRank } from '@/utils/rankSystem';
import ReactCountryFlag from 'react-country-flag';

const countries = [
  { name: "Afghanistan", code: "AF" }, { name: "Albania", code: "AL" }, { name: "Algeria", code: "DZ" },
  { name: "Argentina", code: "AR" }, { name: "Armenia", code: "AM" }, { name: "Australia", code: "AU" },
  { name: "Austria", code: "AT" }, { name: "Azerbaijan", code: "AZ" }, { name: "Bahrain", code: "BH" },
  { name: "Bangladesh", code: "BD" }, { name: "Belarus", code: "BY" }, { name: "Belgium", code: "BE" },
  { name: "Brazil", code: "BR" }, { name: "Bulgaria", code: "BG" }, { name: "Cambodia", code: "KH" },
  { name: "Canada", code: "CA" }, { name: "Chile", code: "CL" }, { name: "China", code: "CN" },
  { name: "Colombia", code: "CO" }, { name: "Croatia", code: "HR" }, { name: "Cyprus", code: "CY" },
  { name: "Czech Republic", code: "CZ" }, { name: "Denmark", code: "DK" }, { name: "Ecuador", code: "EC" },
  { name: "Egypt", code: "EG" }, { name: "Estonia", code: "EE" }, { name: "Finland", code: "FI" },
  { name: "France", code: "FR" }, { name: "Georgia", code: "GE" }, { name: "Germany", code: "DE" },
  { name: "Ghana", code: "GH" }, { name: "Greece", code: "GR" }, { name: "Hungary", code: "HU" },
  { name: "Iceland", code: "IS" }, { name: "India", code: "IN" }, { name: "Indonesia", code: "ID" },
  { name: "Iran", code: "IR" }, { name: "Iraq", code: "IQ" }, { name: "Ireland", code: "IE" },
  { name: "Israel", code: "IL" }, { name: "Italy", code: "IT" }, { name: "Japan", code: "JP" },
  { name: "Jordan", code: "JO" }, { name: "Kazakhstan", code: "KZ" }, { name: "Kenya", code: "KE" },
  { name: "Kuwait", code: "KW" }, { name: "Latvia", code: "LV" }, { name: "Lebanon", code: "LB" },
  { name: "Lithuania", code: "LT" }, { name: "Luxembourg", code: "LU" }, { name: "Malaysia", code: "MY" },
  { name: "Mexico", code: "MX" }, { name: "Morocco", code: "MA" }, { name: "Netherlands", code: "NL" },
  { name: "New Zealand", code: "NZ" }, { name: "Nigeria", code: "NG" }, { name: "Norway", code: "NO" },
  { name: "Pakistan", code: "PK" }, { name: "Peru", code: "PE" }, { name: "Philippines", code: "PH" },
  { name: "Poland", code: "PL" }, { name: "Portugal", code: "PT" }, { name: "Qatar", code: "QA" },
  { name: "Romania", code: "RO" }, { name: "Russia", code: "RU" }, { name: "Saudi Arabia", code: "SA" },
  { name: "Singapore", code: "SG" }, { name: "Slovakia", code: "SK" }, { name: "Slovenia", code: "SI" },
  { name: "South Africa", code: "ZA" }, { name: "South Korea", code: "KR" }, { name: "Spain", code: "ES" },
  { name: "Sri Lanka", code: "LK" }, { name: "Sweden", code: "SE" }, { name: "Switzerland", code: "CH" },
  { name: "Thailand", code: "TH" }, { name: "Turkey", code: "TR" }, { name: "Ukraine", code: "UA" },
  { name: "United Arab Emirates", code: "AE" }, { name: "United Kingdom", code: "GB" }, { name: "United States", code: "US" },
  { name: "Uruguay", code: "UY" }, { name: "Venezuela", code: "VE" }, { name: "Vietnam", code: "VN" }
];

const ranks = [
  { label: 'Beginner', minXP: 0, maxXP: 499, color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '🌱' },
  { label: 'Novice', minXP: 500, maxXP: 999, color: 'text-green-600', bgColor: 'bg-green-100', icon: '📗' },
  { label: 'Competent', minXP: 1000, maxXP: 1999, color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '🛠️' },
  { label: 'Proficient', minXP: 2000, maxXP: 4999, color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '⭐' },
  { label: 'Expert', minXP: 5000, maxXP: Infinity, color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '🏆' },
];

export default function Profile() {
  const router = useRouter();
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
  const [credits, setCredits] = useState<number>(0);
  const [userTrophies, setUserTrophies] = useState<Trophy[]>([]);
  const [loadingTrophies, setLoadingTrophies] = useState<boolean>(false);
  const [referralLink, setReferralLink] = useState<string>("");
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [referralRewards, setReferralRewards] = useState<any[]>([]);
  const [publicProfile, setPublicProfile] = useState<boolean>(true);

  // Trophy image generation
  const generateTrophyImage = async (trophy: Trophy) => {
    const element = document.getElementById(`trophy-${trophy.id}`);
    if (!element) return null;
    try {
      // Try html2canvas first (best visual fidelity)
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#333';
        ctx.fillText(`Rank: ${rankLabel} (${xp} XP)`, 20, canvas.height - 40);
        ctx.font = '16px Arial';
        ctx.fillText('Join me on the platform!', 20, canvas.height - 20);
      }
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('html2canvas failed, falling back to programmatic canvas:', err);
      // Fallback: create a simple programmatic image (avoids parsing CSS)
      const scale = 2;
      const width = 800 * scale;
      const height = 420 * scale;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#fff7ed');
      grad.addColorStop(1, '#fef3c7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Trophy icon circle
      ctx.fillStyle = '#f59e0b';
      const circleX = 120 * scale;
      const circleY = height / 2;
      const circleR = 90 * scale;
      ctx.beginPath();
      ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
      ctx.fill();

      // Trophy emoji
      ctx.font = `${80 * scale}px serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(TrophyService.getTrophyIcon(trophy.trophy_type) || '🏆', circleX, circleY + 6 * scale);

      // Title and description
      ctx.textAlign = 'left';
      ctx.fillStyle = '#111827';
      ctx.font = `${28 * scale}px Arial`;
      ctx.fillText(trophy.title, 240 * scale, 120 * scale);
      ctx.font = `${18 * scale}px Arial`;
      // wrap description
      const desc = trophy.description || '';
      const maxW = 520 * scale;
      let y = 160 * scale;
      const lineHeight = 26 * scale;
      const words = desc.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxW && n > 0) {
          ctx.fillText(line.trim(), 240 * scale, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line) ctx.fillText(line.trim(), 240 * scale, y);

      // Rank and XP
      ctx.font = `${18 * scale}px Arial`;
      ctx.fillStyle = '#065f46';
      ctx.fillText(`Rank: ${rankLabel} (${xp} XP)`, 240 * scale, height - 80 * scale);
      ctx.fillStyle = '#374151';
      ctx.font = `${14 * scale}px Arial`;
      ctx.fillText(`Join me: ${referralLink || window.location.origin}`, 240 * scale, height - 44 * scale);

      return canvas.toDataURL('image/png');
    }
  };

  // helper: convert dataURL to Blob
  const dataURLToBlob = (dataUrl: string) => {
    const parts = dataUrl.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const [sharing, setSharing] = useState<boolean>(false);

  // upload image dataURL to Supabase storage and return public url
  const uploadImageToStorage = async (dataUrl: string, fileName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const blob = dataURLToBlob(dataUrl);
      const filePath = `shared-trophies/${user.id}/${fileName}`;
      // supabase storage upload
      const { error: uploadError } = await supabase.storage
        .from('profileimages')
        .upload(filePath, blob, { upsert: true, contentType: 'image/png' });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage
        .from('profileimages')
        .getPublicUrl(filePath);
      return publicData.publicUrl as string;
    } catch (err) {
      console.error('Upload failed', err);
      return null;
    }
  };

  // Trophy sharing functions
  const shareTrophyToFacebook = async (trophy: Trophy) => {
    setSharing(true);
    try {
      const imageData = await generateTrophyImage(trophy);
      let imageUrl: string | null = null;
      if (imageData) {
        imageUrl = await uploadImageToStorage(imageData, `trophy-${trophy.id}.png`);
      }
      const text = `I earned a ${trophy.trophy_type} trophy on Kick Expert! 🏆 "${trophy.title}" - ${trophy.description} \nCurrent Rank: ${rankLabel} (${xp} XP)\nJoin me: ${referralLink || window.location.origin}`;
      const quote = encodeURIComponent(text + (imageUrl ? `\n${imageUrl}` : ''));
      const u = encodeURIComponent(referralLink || window.location.origin);
      const url = `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${quote}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Opened Facebook share dialog');
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare Facebook share');
    } finally {
      setSharing(false);
    }
  };

  const shareTrophyToX = async (trophy: Trophy) => {
    setSharing(true);
    try {
      const imageData = await generateTrophyImage(trophy);
      let imageUrl: string | null = null;
      if (imageData) imageUrl = await uploadImageToStorage(imageData, `trophy-${trophy.id}.png`);
      const text = encodeURIComponent(`I earned a ${trophy.trophy_type} trophy! 🏆 "${trophy.title}" - ${trophy.description} \nRank: ${rankLabel} (${xp} XP)\n${referralLink || window.location.origin}${imageUrl ? `\n${imageUrl}` : ''}`);
      const url = `https://twitter.com/intent/tweet?text=${text}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Opened X share dialog');
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare X share');
    } finally {
      setSharing(false);
    }
  };

  const shareTrophyToWhatsApp = async (trophy: Trophy) => {
    setSharing(true);
    try {
      const imageData = await generateTrophyImage(trophy);
      let imageUrl: string | null = null;
      if (imageData) imageUrl = await uploadImageToStorage(imageData, `trophy-${trophy.id}.png`);
      const text = encodeURIComponent(`I earned a ${trophy.trophy_type} trophy! 🏆 \n"${trophy.title}" - ${trophy.description} \nRank: ${rankLabel} (${xp} XP)\nJoin: ${referralLink || window.location.origin}${imageUrl ? `\n${imageUrl}` : ''}`);
      const url = `https://api.whatsapp.com/send?text=${text}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Opened WhatsApp share');
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare WhatsApp share');
    } finally {
      setSharing(false);
    }
  };

  const shareTrophyToInstagram = async (trophy: Trophy) => {
    setSharing(true);
    try {
      const imageData = await generateTrophyImage(trophy);
      const text = `I earned a ${trophy.trophy_type} trophy on Kick Expert! 🏆 "${trophy.title}" - ${trophy.description} \nRank: ${rankLabel} (${xp} XP)\nJoin: ${referralLink || window.location.origin}`;
      if (!imageData) {
        // fallback: copy text
        await navigator.clipboard.writeText(text);
        toast.success('Trophy details copied to clipboard! Paste it in Instagram to share.');
        return;
      }

      // Try Web Share API with files (mobile browsers)
      const blob = dataURLToBlob(imageData);
      const file = new File([blob], `trophy-${trophy.id}.png`, { type: 'image/png' });
      // If Web Share API supports files, use it (best UX on mobile)
      // @ts-ignore navigator.canShare may exist
      if (navigator && (navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        try {
          await (navigator as any).share({ files: [file], text, title: 'My Trophy' });
          toast.success('Shared to Instagram (or system share)');
          return;
        } catch (err) {
          // fallthrough to download+copy
          console.warn('Web Share failed', err);
        }
      }

      // Otherwise upload and provide download + clipboard copy for manual posting
      const uploadedUrl = await uploadImageToStorage(imageData, `trophy-${trophy.id}.png`);
      await navigator.clipboard.writeText(text + (uploadedUrl ? `\n${uploadedUrl}` : ''));
      // trigger download of image
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `trophy-${trophy.title}.png`;
      link.click();
      toast.success('Trophy image downloaded and details copied — paste into Instagram to post.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare Instagram share');
    } finally {
      setSharing(false);
    }
  };

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
          .select('avatar_url, nationality, username, total_wins, total_games, xp, rank_label, credits, public_profile')
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
          setCredits(0);
          // Build a fallback UserProfile without unknown properties (avoid 'public_profile' if not defined on the UserProfile type)
          const fallbackProfile: UserProfile = {
            user_id: user.id,
            username: userData.name || "",
            avatar_url: "",
            nationality: "",
            created_at: userData.created_at || "",
            credits: 0,
          };
          setUserProfile(fallbackProfile);
          // Keep the separate boolean state in sync
          setPublicProfile(true);
        } else {
          const profile = profileData as any;
          setUserProfile(profile);
          setNationality(profile.nationality || "");
          setAvatarUrl(profile.avatar_url || "");
          setTotalWins(profile.total_wins || 0);
          setTotalGames(profile.total_games || 0);
          setXp(profile.xp || 0);
          setRankLabel(profile.rank_label || "Beginner");
          setCredits(profile.credits || 0);
          setPublicProfile(profile.public_profile ?? true);
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

  // If referrals table is empty, try to estimate effective referrals from referral_rewards as a fallback
  const computeEffectiveReferrals = () => {
    // Prefer referrals table when any referred users exist.
    if (referredUsers && referredUsers.length > 0) {
      // Show total referred users when they exist. If you prefer only confirmed/joined
      // referrals, we can switch this to count(r => r.email_confirmed || r.competition_joined).
      return { count: referredUsers.length, source: 'referrals' };
    }

    // fallback: estimate from referral_rewards when no referredUsers rows are present
    if (referralRewards && referralRewards.length > 0) {
      const creditedMilestonesTotal = referralRewards
        .filter(r => r.credited)
        .reduce((sum, r) => sum + (r.milestone || 0), 0);
      if (creditedMilestonesTotal > 0) return { count: creditedMilestonesTotal, source: 'referral_rewards' };
      // or use number of pending rewards as an estimate
      return { count: referralRewards.length, source: 'referral_rewards_pending' };
    }

    return { count: 0, source: 'none' };
  };

  const fetchReferralRewards = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      console.info('fetched referral_rewards for user', userId, Array.isArray(data) ? data.length : 0, data);
      setReferralRewards(data || []);
    } catch (error) {
      console.error("Error fetching referral rewards:", error);
      toast.error("Failed to load referral rewards");
    }
  };

  const claimRewards = async (userId: string) => {
    const milestones = [
      { count: 3, reward_type: 'Starter Wallet Credit', credits: 10 },
      { count: 5, reward_type: 'Pro Wallet Credit', credits: 25 },
      { count: 10, reward_type: 'Elite Wallet Credit', credits: 50 },
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
        toast.success("New rewards added successfully!", { style: { background: '#363636', color: '#fff' } });
      } else {
        toast("No new rewards available to add", { icon: 'ℹ️', style: { background: '#363636', color: '#fff' } });
      }
      await fetchReferralRewards(userId);
    } catch (error: any) {
      console.error("Error adding rewards:", error);
      toast.error(error.message || "Failed to add rewards", { style: { background: '#363636', color: '#fff' } });
    }
  };

  const claimIndividualReward = async (rewardId: string, rewardType: string, creditValue?: number) => {
    // Determine amount to credit
    const amount = typeof creditValue === 'number' ? creditValue : 0;

    try {
      // Mark the reward as credited
      const { error: updateError } = await supabase
        .from('referral_rewards')
        .update({ credited: true, updated_at: new Date().toISOString() })
        .eq('id', rewardId);
      if (updateError) throw updateError;

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // If this reward grants credits, add them to the user's profile credits
      if (rewardType === 'credits' && amount > 0) {
        try {
          // read current credits (if any)
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('credits')
            .eq('user_id', user.id)
            .single();

          const currentCredits = (profileData && typeof profileData.credits === 'number') ? profileData.credits : 0;
          const newCredits = currentCredits + amount;

          // upsert the credits value into profiles
          const { error: upsertErr } = await supabase
            .from('profiles')
            .upsert(
              {
                user_id: user.id,
                credits: newCredits,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' } // ✅ ensures Postgres knows which unique key to check
            );

          if (upsertErr) throw upsertErr;

          setCredits(newCredits);
        } catch (err) {
          console.error('Error updating profile credits:', err);
          // continue — reward marked credited even if credits update failed
        }
      }

      toast.success(`Reward claimed successfully! Added ${amount} credits.`, { style: { background: '#363636', color: '#fff' } });
      await fetchReferralRewards(user.id);
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast.error(error.message || 'Failed to claim reward', { style: { background: '#363636', color: '#fff' } });
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
        .upload(filePath, avatarFile, { upsert: true });

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
      toast.error(error.message || "Failed to update avatar", { style: { background: '#363636', color: '#fff' } });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty", { style: { background: '#363636', color: '#fff' } });
      return;
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast.error("User not authenticated", { style: { background: '#363636', color: '#fff' } });
      return;
    }
    try {
      const { error: userError } = await supabase
        .from("users")
        .upsert(
          {
            id: user.id, // required because it's PK + FK to auth.users
            email: user.email,
            name: newName.trim(),
            // age, // Removed because 'age' is not defined
            accepted_terms: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (userError) throw userError;
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          username: newName.trim(),
          nationality: nationality,
          public_profile: publicProfile,
          updated_at: new Date().toISOString(),
        });
      if (profileError) throw profileError;
      if (avatarFile) {
        await uploadAvatar();
      }
      setName(newName.trim());
      setUserProfile({ ...userProfile, username: newName.trim(), nationality } as UserProfile);
      setIsEditingProfile(false);
      toast.success("Profile updated successfully", { style: { background: '#363636', color: '#fff' } });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", { style: { background: '#363636', color: '#fff' } });
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields", { style: { background: '#363636', color: '#fff' } });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match", { style: { background: '#363636', color: '#fff' } });
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters", { style: { background: '#363636', color: '#fff' } });
      return;
    }
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });
      if (signInError) {
        toast.error("Incorrect current password", { style: { background: '#363636', color: '#fff' } });
        return;
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Password changed successfully", { style: { background: '#363636', color: '#fff' } });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error.message);
      toast.error(error.message || "Failed to update password", { style: { background: '#363636', color: '#fff' } });
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
      toast.success('Referral link copied to clipboard! Paste it in Instagram to share.', { style: { background: '#363636', color: '#fff' } });
    } catch (error) {
      toast.error('Failed to copy referral link', { style: { background: '#363636', color: '#fff' } });
    }
  };

  const getReferralProgress = () => {
    const estimated = computeEffectiveReferrals();
    const effectiveCount = estimated.count;
    const milestones = [3, 5, 10];
    const nextMilestone = milestones.find(m => effectiveCount < m) || 10;
    const progress = (effectiveCount / nextMilestone) * 100;
    return { effectiveCount, nextMilestone, progress, source: estimated.source };
  };

  const getCountryCode = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    return country ? country.code : '';
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
                              priority
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
                            <label className="block text-sm font-medium text-gray-700 mb-3">Public Profile</label>
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-xl">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <svg
                                    className="w-5 h-5 mr-3 text-lime-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">Allow others to see my profile on leaderboard</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {publicProfile ? 'Your profile is visible to other users on leaderboards and rankings' : 'Your profile is private and hidden from leaderboards'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4">
                                <button
                                  type="button"
                                  onClick={() => setPublicProfile(!publicProfile)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 ${
                                    publicProfile ? 'bg-lime-500' : 'bg-gray-300'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      publicProfile ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
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
                                <ReactCountryFlag
                                  countryCode={getCountryCode(nationality)}
                                  svg
                                  style={{ width: '1.5em', height: '1.5em', marginRight: '0.5em' }}
                                  title={nationality}
                                />
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              Profile is {publicProfile ? 'Public' : 'Private'}
                            </div>
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


              {/* Referral Program Card */}
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
                        d="M18 9a2 2 0 00-2-2H8a2 2 0 00-2 2m12 0v6a2 2 0 01-2 2H8a2 2 0 01-2-2V9m6 6v3m0 0l-3-3m3 3l3-3"
                      />
                    </svg>
                    Referral Program
                    <span className="ml-2 bg-lime-100 text-lime-800 text-xs font-medium px-2 py-1 rounded-full">
                      {referredUsers.length}
                    </span>
                  </h3>
                  <div className="mb-6 bg-gradient-to-r from-lime-50 to-green-50 p-4 rounded-lg border border-lime-200">
                    {/* <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-lime-800 mb-2">Referral Progress</h4>
                      <button
                        onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (user) {
                            await fetchReferrals(user.id);
                            await fetchReferralRewards(user.id);
                          }
                        }}
                        className="text-xs text-lime-700 underline ml-2"
                      >
                        Refresh
                      </button>
                    </div> */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-lime-700">
                        Effective Referrals: {getReferralProgress().effectiveCount}
                      </span>
                      <span className="text-sm text-lime-700">
                        Next Milestone: {getReferralProgress().nextMilestone} referrals
                      </span>
                    </div>
                    {getReferralProgress().source !== 'referrals' && (
                      <p className="text-xs text-gray-500 mt-1">Showing estimated referrals from rewards data (fall-back).</p>
                    )}
                    <div className="w-full bg-lime-200 rounded-full h-2">
                      <div
                        className="bg-lime-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getReferralProgress().progress}%` }}
                      ></div>
                    </div>

                    <p className="text-xs text-lime-600 mt-2">
                      Invite friends to earn competition credits! Get +10 credits for every friend who registers.
                    </p>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Referral Link</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-lime-100 focus:border-lime-400"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(referralLink);
                            toast.success('Referral link copied!');
                          } catch (err) {
                            toast.error('Failed to copy');
                          }
                        }}
                        className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white font-medium rounded-r-lg transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <QRCodeCanvas value={referralLink} size={128} bgColor="#ffffff" fgColor="#000000" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Scan this QR code to share your referral link!
                    </p>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Share Your Referral Link</h4>
                    <div className="flex space-x-3">
                      <button onClick={shareReferralToFacebook} title="Share on Facebook" className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                        </svg>
                      </button>
                      <button onClick={shareReferralToX} title="Share on X" className="p-2 bg-black rounded-full hover:bg-gray-800 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </button>
                      <button onClick={shareReferralToWhatsApp} title="Share on WhatsApp" className="p-2 bg-[#25D366] rounded-full hover:bg-[#20BA56] transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448-2.207 1.526-4.874 2.589-7.7 2.654zm8.21-19.701c-2.207 0-4.003 1.796-4.003 4.003 0 .884.335 1.696.892 2.31l-.958 3.492 3.586-.926c.609.53 1.39.834 2.212.834 2.207 0 4.003-1.796 4.003-4.003 0-2.207-1.796-4.003-4.003-4.003zm3.04 6.373c.128.07.174.224.104.348-.047.083-.293.382-1.006 1.095-1.001 1-1.83 1.047-2.2-2.136 0-1.023.79-1.767 1.116-2.044.093-.07.186-.093.279-.093h.279c.093 0 .186 0 .232.14.047.14 .186.372.511.977.093.186.186.372.232.511.047.14.07.232 0 .326-.07.093-.14.279-.186.418-.047.14-.07.279 0 .372.07.093.558.93 1.209 1.488.837.651 1.488.93 1.674 1.023.186.093.279.093.372-.047.093-.14.418-.558.558-.744.14-.186.279-.14.372-.093.093.047.651.325.977.511.326.186.558.279.651.325.093.047.14.07.14.186 0 .116-.07.279-.186.372z" />
                        </svg>
                      </button>
                      <button onClick={shareReferralToInstagram} title="Share on Instagram" className="p-2 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full hover:brightness-105 transition">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.95.272.16 3.057 0 7.163 0 8.412 0 8.741 0 12c0 3.259 0 3.668 0 4.948 0 4.106 2.787 6.891 6.893 6.891 1.28 0 1.609 0 4.948 0 3.259 0 3.668 0 4.948 0 4.106 0 6.891-2.785 6.891-6.891 0-1.28 0-1.609 0-4.948 0-3.259 0-3.668 0-4.948 0-4.106-2.785-6.891-6.891-6.891-1.28 0-1.609 0-4.948 0-3.259 0-3.668 0-4.948 0zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* <h4 className="text-lg font-semibold text-gray-700 mb-2">Referred Users</h4>
                  {referredUsers.length === 0 ? (
                    <p className="text-gray-500">No referred users yet.</p>
                  ) : (
                    <ul className="space-y-3 max-h-40 overflow-y-auto">
                      {referredUsers.map((ref) => (
                        <li key={ref.id} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm"><span className="font-medium text-gray-700">Referred ID:</span> {ref.referred_id}</p>
                          <p className="text-sm"><span className="font-medium text-gray-700">Email Confirmed:</span> {ref.email_confirmed ? 'Yes (+50 XP)' : 'No'}</p>
                          <p className="text-sm"><span className="font-medium text-gray-700">Competition Joined:</span> {ref.competition_joined ? 'Yes (+100 XP)' : 'No'}</p>
                          <p className="text-sm"><span className="font-medium text-gray-700">Created At:</span> {new Date(ref.created_at).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  )} */}
                  <h4 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Referral Rewards <span className="ml-2 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">{referralRewards.length}</span></h4>
                  {referralRewards.length === 0 ? (
                    <p className="text-gray-500">No rewards earned yet.</p>
                  ) : (
                    <ul className="space-y-3 max-h-40 overflow-y-auto">
                      {referralRewards.map((reward) => (
                        <li key={reward.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="text-sm"><span className="font-medium text-gray-700">Milestone:</span> {reward.milestone} referrals</p>
                            <p className="text-sm"><span className="font-medium text-gray-700">Reward Type:</span> {reward.reward_type}</p>
                            <p className="text-sm"><span className="font-medium text-gray-700">Value:</span> {reward.credit_value ?? '-'}</p>
                          </div>

                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) await claimRewards(user.id);
                    }}
                    className="mt-6 px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Check for New Rewards
                  </button>
                </div>
              </div>

            </div>
            {/* Right Column - Trophies & Password Security */}
            <div className="w-full lg:w-1/2 space-y-6">

               {/* Game Statistics Card */}
              {/* <div className=" bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
             
                  <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`p-2 ${getRankFromXP(xp).bgColor} rounded-full mr-3`}>
                          <span className="text-xl">{getRankFromXP(xp).icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-yellow-700">Current Rank</p>
                          <p className={`text-xl font-bold ${getRankFromXP(xp).color}`}>
                            {getRankFromXP(xp).label}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-yellow-600">XP Progress</p>
                        <p className="text-lg font-bold text-yellow-800">{xp} XP</p>
                      </div>
                    </div>
                 
                    {(() => {
                      const nextRankInfo = getNextRank(xp);
                      if (nextRankInfo) {
                        const progress = getProgressToNextRank(xp);
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-yellow-600">
                                Next: {nextRankInfo.nextRank.label}
                              </span>
                              <span className="text-xs text-yellow-600">
                                {nextRankInfo.xpNeeded} XP needed
                              </span>
                            </div>
                            <div className="w-full bg-yellow-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-center">
                            <span className="text-xs text-yellow-600 font-medium">
                              🏆 Maximum Rank Achieved! 🏆
                            </span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div> */}



              
              {/* Trophies Card */}
              {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-yellow-500"
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
                    <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      {userTrophies.length}
                    </span>
                  </h3>
                  {loadingTrophies ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
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
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-amber-700">
                            {userTrophies.filter(t => t.trophy_type === 'bronze').length}
                          </div>
                          <div className="text-xs text-amber-600 font-medium flex items-center justify-center">
                            🥉 Starter
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-700">
                            {userTrophies.filter(t => t.trophy_type === 'silver').length}
                          </div>
                          <div className="text-xs text-gray-600 font-medium flex items-center justify-center">
                            🥈 Pro
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-700">
                            {userTrophies.filter(t => t.trophy_type === 'gold').length}
                          </div>
                          <div className="text-xs text-yellow-600 font-medium flex items-center justify-center">
                            🥇 Elite
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {userTrophies.map((trophy, index) => {
                          const colors = TrophyService.getTrophyColors(trophy.trophy_type);
                          return (
                            <div
                              key={trophy.id}
                              id={`trophy-${trophy.id}`}
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
                                        {trophy.trophy_type === 'bronze' ? 'Starter' : trophy.trophy_type === 'silver' ? 'Pro' : trophy.trophy_type === 'gold' ? 'Elite' : trophy.trophy_type.charAt(0).toUpperCase() + trophy.trophy_type.slice(1)}
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
                              <div className="mt-4 flex space-x-3">
                                <button onClick={() => shareTrophyToFacebook(trophy)} title="Share on Facebook" className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                                  </svg>
                                </button>
                                <button onClick={() => shareTrophyToX(trophy)} title="Share on X" className="p-2 bg-black rounded-full hover:bg-gray-800 transition-colors">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                  </svg>
                                </button>
                                <button onClick={() => shareTrophyToWhatsApp(trophy)} title="Share on WhatsApp" className="p-2 bg-[#25D366] rounded-full hover:bg-[#20BA56] transition-colors">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448-2.207 1.526-4.874 2.589-7.7 2.654zm8.21-19.701c-2.207 0-4.003 1.796-4.003 4.003 0 .884.335 1.696.892 2.31l-.958 3.492 3.586-.926c.609.53 1.39.834 2.212.834 2.207 0 4.003-1.796 4.003-4.003 0-2.207-1.796-4.003-4.003-4.003zm3.04 6.373c.128.07.174.224.104.348-.047.083-.293.382-1.006 1.095-1.001 1-1.83 1.047-2.2-2.136 0-1.023.79-1.767 1.116-2.044.093-.07.186-.093.279-.093h.279c.093 0 .186 0 .232.14.047.14 .186.372.511.977.093.186.186.372.232.511.047.14.07.232 0 .326-.07.093-.14.279-.186.418-.047.14-.07.279 0 .372.07.093.558.93 1.209 1.488.837.651 1.488.93 1.674 1.023.186.093.279.093.372-.047.093-.14.418-.558.558-.744.14-.186.279-.14.372-.093.093.047.651.325.977.511.326.186.558.279.651.325.093.047.14.07.14.186 0 .116-.07.279-.186.372z" />
                                  </svg>
                                </button>
                                <button onClick={() => shareTrophyToInstagram(trophy)} title="Share on Instagram" className="p-2 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full hover:brightness-105 transition">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.95.272.16 3.057 0 7.163 0 8.412 0 8.741 0 12c0 3.259 0 3.668 0 4.948 0 4.106 2.787 6.891 6.893 6.891 1.28 0 1.609 0 4.948 0 3.259 0 3.668 0 4.948 0 4.106 0 6.891-2.785 6.891-6.891 0-1.28 0-1.609 0-4.948 0-3.259 0-3.668 0-4.948 0-4.106-2.785-6.891-6.891-6.891-1.28 0-1.609 0-4.948 0-3.259 0-3.668 0-4.948 0zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {(() => {
                        const nextMilestone = TrophyService.getNextMilestone(xp);
                        if (nextMilestone) {
                          return (
                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-blue-800">Next Trophy</h5>
                                  <p className="text-blue-700 text-sm">{nextMilestone.title}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-800">
                                    {nextMilestone.xpNeeded} XP
                                  </div>
                                  <div className="text-xs text-blue-600">needed</div>
                                </div>
                              </div>
                              <div className="mt-2 bg-blue-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
              </div> */}
           
              {/* Password Security */}
              <div className="bg-white h-fit p-4 sm:p-6 md:p-8 rounded-2xl shadow-md border border-gray-100">
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
          </div>
        )}
      </div>
    </div>
  );
}