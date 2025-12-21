import { createServerClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all data in parallel
  const [
    profileResult,
    creditsResult,
    transactionsResult,
    leaderboardResult,
    trophiesResult,
    trophyStatsResult,
    supportTicketsResult
  ] = await Promise.all([
    // 1. Profile
    supabase
      .from("profiles")
      .select("username, xp, total_games, total_wins, rank_label, avatar_url")
      .eq("user_id", user.id)
      .single(),

    // 2. Credits
    supabase
      .from('user_credits')
      .select('purchased_credits, winnings_credits, referral_credits')
      .eq('user_id', user.id)
      .single(),

    // 3. Transactions
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    // 4. Leaderboard
    supabase.rpc("get_top_users_leaderboard"),

    // 5. User Trophies
    supabase.rpc('get_user_trophies', {
      target_user_id: user.id
    }),

    // 6. Trophy Stats
    supabase.rpc('get_user_trophy_stats', {
      target_user_id: user.id
    }),

    // 7. Support Tickets
    supabase
      .from("support")
      .select("id, user_id, topic, description, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
  ]);

  // Process Profile Data
  const profile = profileResult.data;
  const profileData = profile ? {
    username: profile.username || "User",
    email: user.email || "",
    xp: profile.xp || 0,
    total_games: profile.total_games || 0,
    total_wins: profile.total_wins || 0,
    rank_label: profile.rank_label || "Rookie",
    avatar_url: profile.avatar_url,
  } : null;

  // Process Credits Data
  const creditsData = creditsResult.data;
  const credits = {
    purchased: Number(creditsData?.purchased_credits) || 0,
    winnings: Number(creditsData?.winnings_credits) || 0,
    referral: Number(creditsData?.referral_credits) || 0,
  };

  // Process Trophy Stats
  const trophyStats = trophyStatsResult.data && trophyStatsResult.data.length > 0
    ? trophyStatsResult.data[0]
    : null;

  return (
    <div>
      <Navbar />
      <Dashboard
        initialProfileData={profileData}
        initialCredits={credits}
        initialTransactions={transactionsResult.data || []}
        initialLeaderboard={leaderboardResult.data || []}
        initialUserTrophies={trophiesResult.data || []}
        initialTrophyStats={trophyStats}
        initialSupportTickets={supportTicketsResult.data || []}
        userEmail={user.email || ""}
      />
      <Footer />
    </div>
  );
}
