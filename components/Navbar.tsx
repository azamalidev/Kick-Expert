'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from 'react-hot-toast';
import {
  FaSearch,
  FaBell,
  FaUser,
  FaUserCircle,
  FaSignOutAlt,
  FaInfoCircle,
  FaShieldAlt,
  FaEnvelope,
  FaCircle
} from "react-icons/fa";
import { MdMenu, MdClose, MdDashboard } from "react-icons/md";
import { Bot, Target, Trophy, Crown, BarChart3 } from "lucide-react";
import { SupabaseUser, UserProfile } from '@/types/user';

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [currentHash, setCurrentHash] = useState<string>("");

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [newNotificationAlert, setNewNotificationAlert] = useState<boolean>(false);
  const [lastNotificationCheck, setLastNotificationCheck] = useState<Date>(new Date());

  // Fetch notifications from multiple sources
  const fetchNotifications = async (userId: string) => {
    try {
      // 1. Notifications table
      const { data: notifData } = await supabase
        .from('notifications')
        .select('id, title, message, created_at, is_read, type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // 2. Trophies table
      const { data: trophiesData } = await supabase
        .from('trophies')
        .select('id, name as title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Format trophies data
      const formattedTrophies = trophiesData?.map(trophy => ({
        ...trophy,
        message: 'You earned a new trophy!',
        type: 'trophy',
        is_read: false
      })) || [];

      // 3. Quiz results table
      const { data: quizData } = await supabase
        .from('quiz_results')
        .select('id, quiz_name as title, score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Format quiz data
      const formattedQuiz = quizData?.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        message: `You scored ${quiz.score} points`,
        created_at: quiz.created_at,
        type: 'quiz',
        is_read: false
      })) || [];

      // 4. Live competitions
      const { data: liveCompData } = await supabase
        .from('livecompetitions')
        .select('id, competition_name as title, start_time, created_at')
        .lte('start_time', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Format competitions data
      const formattedCompetitions = liveCompData?.map(comp => ({
        id: comp.id,
        title: comp.title,
        message: 'Competition is starting soon!',
        created_at: comp.created_at,
        type: 'competition',
        is_read: false
      })) || [];

      // Merge all notifications
      const merged = [
        ...(notifData || []),
        ...formattedTrophies,
        ...formattedQuiz,
        ...formattedCompetitions,
      ];

      // Sort by created_at (newest first)
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Keep top 15 most recent
      const recentNotifications = merged.slice(0, 15);
      setNotifications(recentNotifications);
      
      // Calculate unread count
      const unread = recentNotifications.filter(notif => !notif.is_read).length;
      setUnreadCount(unread);

      // Check for new notifications since last check
      const newNotifications = recentNotifications.filter(notif => 
        new Date(notif.created_at) > lastNotificationCheck
      );
      
      if (newNotifications.length > 0 && !notificationOpen) {
        setNewNotificationAlert(true);
        // Show toast for new notifications
        if (newNotifications.length === 1) {
          toast.success(`New notification: ${newNotifications[0].title}`);
        } else {
          toast.success(`${newNotifications.length} new notifications`);
        }
      }

      // Update last check time
      setLastNotificationCheck(new Date());

    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark notifications as read when dropdown is opened
  const markNotificationsAsRead = async (userId: string) => {
    try {
      // Update notifications in the database
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
      setNewNotificationAlert(false);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Monitor auth state and fetch user data
  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error || !data) {
          console.error("Error fetching user data:", error);
          setUserName("User");
          setRole("user");
        } else {
          const userData = data as SupabaseUser;
          setUserName(userData.name || "User");
          setRole(userData.role || "user");
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) {
          console.error("Error fetching profile data:", profileError);
          setUserProfile(null);
          setAvatarUrl("");
        } else {
          setUserProfile(profileData as UserProfile);
          setAvatarUrl(profileData.avatar_url || "");
        }

        // Fetch notifications for the user
        fetchNotifications(userId);

      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data");
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) fetchUserData(currentUser.id);
      else {
        setUserName("");
        setRole("");
        setUserProfile(null);
        setAvatarUrl("");
        setNotifications([]);
        setUnreadCount(0);
        setNewNotificationAlert(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const notificationsSubscription = supabase
      .channel('notifications-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          // Show alert for new notification
          setNewNotificationAlert(true);
          
          // Fetch updated notifications
          fetchNotifications(user.id);
          
          // Show toast alert
          toast.success(`New notification: ${payload.new.title || 'New update'}`, {
            icon: '🔔',
          });
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trophies', filter: `user_id=eq.${user.id}` },
        () => {
          setNewNotificationAlert(true);
          fetchNotifications(user.id);
          toast.success('You earned a new trophy! 🏆');
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quiz_results', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNewNotificationAlert(true);
          fetchNotifications(user.id);
          toast.success(`Quiz completed! Score: ${payload.new.score} 📝`);
        }
      )
      .subscribe();

    return () => {
      notificationsSubscription.unsubscribe();
    };
  }, [user]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchNotifications(user.id);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle hash changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateHash = () => setCurrentHash(window.location.hash);
    window.addEventListener("hashchange", updateHash);
    updateHash();
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  // Focus search input
  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

  const toggleSearch = () => setIsOpen(!isOpen);

  const handleNotificationClick = () => {
    const wasClosed = !notificationOpen;
    setNotificationOpen(!notificationOpen);
    
    if (user && wasClosed) {
      markNotificationsAsRead(user.id);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserName("");
      setRole("");
      setUserProfile(null);
      setAvatarUrl("");
      setDropdownOpen(false);
      setNotificationOpen(false);
      setMenuOpen(false);
      setNotifications([]);
      setUnreadCount(0);
      setNewNotificationAlert(false);
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error: any) {
      console.error("Logout Error:", error.message);
      toast.error("Failed to log out");
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (pathname !== "/") {
      router.push(`/#${sectionId}`);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const isActive = (href: string, section?: string) => {
    if (section && pathname === "/") return currentHash === `#${section}`;
    return pathname === href;
  };

  // Format notification date
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trophy': return '🏆';
      case 'quiz': return '📝';
      case 'competition': return '⚽';
      default: return '🔔';
    }
  };

  return (
    <nav className="bg-white w-full z-50 shadow-sm fixed top-0">
      <div className="flex justify-between items-center px-4 py-3 md:px-8 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-8 h-8 md:w-10 md:h-10" />
          <span className="ml-2 text-lime-400 font-bold text-lg md:text-xl">Kick<span className="text-black">Expert</span></span>
        </Link>

        {/* Desktop Nav Links */}
        {role !== "admin" && (
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => scrollToSection("chat-assistant")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isActive("/", "chat-assistant")
                  ? "bg-lime-100 text-lime-700 shadow-inner"
                  : "text-gray-600 hover:bg-lime-50 hover:text-lime-600"
                }`}
            >
              <Bot className="w-5 h-5 mb-[3px]" />
              <span>Ask AI</span>
            </button>

            <Link href="/quiz">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isActive("/quiz")
                    ? "bg-lime-100 text-lime-700 shadow-inner"
                    : "text-gray-600 hover:bg-lime-50 hover:text-lime-600"
                  }`}
              >
                <Target className="w-5 h-5" />
                <span>Quiz</span>
              </button>
            </Link>

            <Link href="/livecompetition">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isActive("/livecompetition")
                    ? "bg-lime-100 text-lime-700 shadow-inner"
                    : "bg-lime-50 text-lime-600 hover:bg-lime-100"
                  }`}
              >
                <Trophy className="w-5 h-5" />
                <span>Competitions</span>
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white animate-pulse">Live</span>
              </button>
            </Link>

            <Link href="/leaderboard">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isActive("/leaderboard")
                    ? "bg-lime-100 text-lime-700 shadow-inner"
                    : "text-gray-600 hover:bg-lime-50 hover:text-lime-600"
                  }`}
              >
                <Crown className="w-5 h-5" />
                <span>Leaderboard</span>
              </button>
            </Link>
          </div>
        )}

        {/* Right Icons - Desktop */}
        <div className="hidden lg:flex items-center gap-6">
          {role !== "admin" && (
            <div className="relative flex">
              {/* Search Bar */}
              <div
                className={`absolute right-[-10px] bottom-[-10] bg-white border border-gray-200 rounded-full overflow-hidden transition-all duration-300 ease-in-out shadow-md ${isOpen ? "w-56 opacity-100" : "w-0 opacity-0"
                  }`}
              >
                <div className="flex items-center px-4 py-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search ..."
                    className="flex-grow outline-none text-gray-700 placeholder-gray-500 text-sm bg-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={toggleSearch}
                className={`text-gray-600 hover:text-lime-600 text-lg cursor-pointer transition-colors z-10 ${isOpen ? "text-lime-600" : ""
                  }`}
                aria-label="Search"
              >
                <FaSearch />
              </button>
            </div>
          )}

          {user && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleNotificationClick}
                className="text-gray-600 hover:text-lime-600 cursor-pointer mt-[7px] text-lg transition-colors relative"
                aria-label="Notifications"
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
                {newNotificationAlert && unreadCount === 0 && (
                  <span className="absolute -top-1 -right-1 bg-lime-500 text-white text-xs rounded-full w-2 h-2 flex items-center justify-center animate-pulse" />
                )}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-lime-50 text-gray-700 font-medium border-b border-gray-200 flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-lime-500 text-white text-xs rounded-full px-2 py-1">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`px-4 py-3 hover:bg-lime-50 transition-colors border-b border-gray-100 last:border-b-0 ${!notif.is_read ? 'bg-lime-50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <span className="text-lg mt-0.5">{getNotificationIcon(notif.type || 'default')}</span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 font-medium">{notif.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-500 mt-2">{formatNotificationDate(notif.created_at)}</p>
                            </div>
                            {!notif.is_read && (
                              <FaCircle className="text-lime-500 text-xs mt-1 animate-pulse" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 focus:outline-none group"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-lime-400 transition-all hover:border-lime-500">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={userName || "User"}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-lime-100 flex items-center justify-center">
                      <FaUser className="text-lime-600 text-sm" />
                    </div>
                  )}
                </div>
                <span className="text-gray-700 font-medium">{userName || "User"}</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {role === "admin" ? (
                    <>
                      <Link
                        href="/admindashboard"
                        className={`px-4 py-3 flex items-center transition-colors ${isActive("/admindashboard")
                            ? 'bg-lime-100 text-lime-700'
                            : 'text-gray-700 hover:bg-lime-50'
                          }`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <MdDashboard className="mr-3 text-lime-500 text-lg" />
                        <span>Admin Dashboard</span>
                      </Link>
                      <div className="border-t border-gray-200">
                        <button
                          className="px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center w-full text-left transition-colors"
                          onClick={handleLogout}
                        >
                          <FaSignOutAlt className="mr-3 text-red-500 text-lg" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/profile"
                        className={`px-4 py-3 flex items-center transition-colors ${isActive("/profile")
                            ? 'bg-lime-100 text-lime-700'
                            : 'text-gray-700 hover:bg-lime-50'
                          }`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="text-lg overflow-hidden mr-3">
                          <div className="w-full h-full flex items-center justify-center">
                            <FaUser className="text-lime-500" />
                          </div>
                        </div>
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/dashboard"
                        className={`px-4 py-3 flex items-center transition-colors ${isActive("/dashboard")
                            ? 'bg-lime-100 text-lime-700'
                            : 'text-gray-700 hover:bg-lime-50'
                          }`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <MdDashboard className="mr-3 text-lime-500 text-lg" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        href="/about"
                        className={`px-4 py-3 flex items-center transition-colors ${isActive("/about")
                            ? 'bg-lime-100 text-lime-700'
                            : 'text-gray-700 hover:bg-lime-50'
                          }`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FaInfoCircle className="mr-3 text-lime-500 text-lg" />
                        <span>About</span>
                      </Link>
                      <Link
                        href="/policy"
                        className={`px-4 py-3 flex items-center transition-colors ${isActive("/policy")
                            ? 'bg-lime-100 text-lime-700'
                            : 'text-gray-700 hover:bg-lime-50'
                          }`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FaShieldAlt className="mr-3 text-lime-500 text-lg" />
                        <span>Policy</span>
                      </Link>
                      <Link
                        href="/contact"
                        className={`px-4 py-3 flex items-center transition-colors ${isActive("/contact")
                            ? 'bg-lime-100 text-lime-700'
                            : 'text-gray-700 hover:bg-lime-50'
                          }`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FaEnvelope className="mr-3 text-lime-500 text-lg" />
                        <span>Contact</span>
                      </Link>
                      <div className="border-t border-gray-200">
                        <button
                          className="px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center w-full text-left transition-colors"
                          onClick={handleLogout}
                        >
                          <FaSignOutAlt className="mr-3 text-red-500 text-lg" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href="/login">
                <button className="py-2 px-4 flex items-center justify-center bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg transition-colors font-medium">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="py-2 px-4 flex items-center justify-center bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition-colors font-medium shadow-md">
                  Signup
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-2xl text-lime-600 focus:outline-none p-1 rounded-full hover:bg-lime-100 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <MdClose /> : <MdMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {role !== "admin" && (
              <>
                <button
                  onClick={() => scrollToSection("chat-assistant")}
                  className={`block w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/", "chat-assistant")
                      ? "bg-lime-100 text-lime-700"
                      : "text-gray-700 hover:bg-lime-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5" />
                    <span>Ask AI</span>
                  </div>
                </button>

                <Link href="/quiz">
                  <button
                    className={`block w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/quiz")
                        ? "bg-lime-100 text-lime-700"
                        : "text-gray-700 hover:bg-lime-50"
                      }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5" />
                      <span>Quiz</span>
                    </div>
                  </button>
                </Link>

                <Link href="/livecompetition">
                  <button
                    className={`block w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/livecompetition")
                        ? "bg-lime-100 text-lime-700"
                        : "text-gray-700 hover:bg-lime-50"
                      }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5" />
                      <span>Competitions</span>
                      <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-red-500 text-white animate-pulse">
                        Live
                      </span>
                    </div>
                  </button>
                </Link>

                <Link href="/leaderboard">
                  <button
                    className={`block w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/leaderboard")
                        ? "bg-lime-100 text-lime-700"
                        : "text-gray-700 hover:bg-lime-50"
                      }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5" />
                      <span>Leaderboard</span>
                    </div>
                  </button>
                </Link>

                <Link href="/stats">
                  <button
                    className={`block w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/stats")
                        ? "bg-lime-100 text-lime-700"
                        : "text-gray-700 hover:bg-lime-50"
                      }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5" />
                      <span>Stats</span>
                    </div>
                  </button>
                </Link>
              </>
            )}

            {user && role !== "admin" && (
              <>
                <Link
                  href="/profile"
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/profile")
                      ? "bg-lime-100 text-lime-700"
                      : "text-gray-700 hover:bg-lime-50"
                    }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-lime-400">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={userName || "User"}
                          width={20}
                          height={20}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-lime-100 flex items-center justify-center">
                          <FaUser className="text-lime-600 text-xs" />
                        </div>
                      )}
                    </div>
                    <span>Profile</span>
                  </div>
                </Link>
                <Link
                  href="/dashboard"
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/dashboard")
                      ? "bg-lime-100 text-lime-700"
                      : "text-gray-700 hover:bg-lime-50"
                    }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <MdDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link
                  href="/about"
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/about")
                      ? "bg-lime-100 text-lime-700"
                      : "text-gray-700 hover:bg-lime-50"
                    }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <FaInfoCircle className="w-5 h-5" />
                    <span>About</span>
                  </div>
                </Link>
                <Link
                  href="/policy"
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/policy")
                      ? "bg-lime-100 text-lime-700"
                      : "text-gray-700 hover:bg-lime-50"
                    }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <FaShieldAlt className="w-5 h-5" />
                    <span>Policy</span>
                  </div>
                </Link>
                <Link
                  href="/contact"
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/contact")
                      ? "bg-lime-100 text-lime-700"
                      : "text-gray-700 hover:bg-lime-50"
                    }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="w-5 h-5" />
                    <span>Contact</span>
                  </div>
                </Link>
              </>
            )}
            {user && role === "admin" && (
              <Link
                href="/admindashboard"
                className={`block py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/admindashboard")
                    ? "bg-lime-100 text-lime-700"
                    : "text-gray-700 hover:bg-lime-50"
                  }`}
                onClick={() => setMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <MdDashboard className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </div>
              </Link>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-200">
            {user ? (
              <>
                <div className="flex items-center justify-between py-3 px-2">
                  <span className="text-gray-700 font-bold">Welcome, {userName || "User"}</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {unreadCount} new notifications
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors mt-2 flex items-center justify-center gap-2 font-medium"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  className="py-3 px-4 bg-lime-100 hover:bg-lime-200 text-lime-700 text-center rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="py-3 px-4 bg-lime-600 hover:bg-lime-700 text-white text-center rounded-lg transition-colors flex items-center justify-center gap-2 font-medium shadow-md"
                  onClick={() => setMenuOpen(false)}
                >
                  Signup
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}