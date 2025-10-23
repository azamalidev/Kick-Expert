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
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(false);
  const [lastNotificationCheck, setLastNotificationCheck] = useState<Date>(new Date());
  // We'll fetch notifications from the `public.notifications` table and
  // subscribe to realtime updates. If RLS prevents DB writes, the component
  // will gracefully fall back to local-state-only reads.

  // Fetch notifications from multiple sources
  const fetchNotifications = async (userId: string) => {
    try {
      // 1) Query the notifications table for this user
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Respect marketing opt-in: if user hasn't opted in, exclude promotional notifications
      if (!marketingOptIn) {
        query = (query as any).neq('type', 'promotional');
      }

      // Fetch latest notifications (read or unread) and limit to 3 for the navbar
      query = (query as any).limit(3);

      const { data: notifData, error: notifError } = await query;

      if (notifError) {
        // If we hit a permission error because of RLS, log and fall back
        // to an empty list so other sources can still populate notifications.
        console.warn('notifications fetch error (RLS or missing table):', notifError.message || notifError);
      }

      // Start with notifications from the DB (if any) and normalize shape.
      // The DB uses an `is_read` boolean column. Ensure `is_read` exists
      // and created_at is present for each notification.
  const dbNotifsRaw: any[] = (notifData as any[] | undefined) || [];
      const dbNotifs: any[] = dbNotifsRaw.map((n: any) => ({
        ...n,
        // Ensure created_at exists and is a string/Date compatible field
        created_at: n.created_at || n.createdAt || new Date().toISOString(),
        // DB now uses is_read boolean column
        is_read: !!n.is_read,
      }));

      // 2. Trophies table
      const { data: trophiesData } = await supabase
        .from('trophies')
        .select('id, name as title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Format trophies data
      // trophiesData items can be returned with loose typings from Supabase client so
      // cast each item to `any` and explicitly map expected fields to avoid
      // "Spread types may only be created from object types" TypeScript error.
      // const formattedTrophies = (trophiesData as any[] | undefined)?.map((trophy: any) => ({
      //   id: trophy?.id,
      //   title: trophy?.title ?? trophy?.name,
      //   created_at: trophy?.created_at ?? trophy?.earned_at ?? new Date().toISOString(),
      //   message: 'You earned a new trophy!',
      //   type: 'trophy',
      //   is_read: false,
      // })) || [];

      // 3. Quiz results table (guarded in case the table/view doesn't exist)
      let formattedQuiz: any[] = [];
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_results')
          .select('id, quiz_name, score, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (quizError) {
          // Table may not exist or permission error; log and continue
          console.warn('quiz_results fetch error (table may be missing):', quizError);
        } else {
          formattedQuiz = (quizData as any[] | undefined)?.map((quiz: any) => ({
            id: quiz.id,
            title: quiz.quiz_name,
            message: `You scored ${quiz.score} points`,
            created_at: quiz.created_at,
            type: 'quiz',
            is_read: false
          })) || [];
        }
      } catch (err) {
        console.warn('Unexpected error fetching quiz_results:', err);
      }

      // 4. Live competitions (use `competitions` table and alias `name` to `competition_name`)
      const { data: liveCompData } = await supabase
        .from('competitions')
        .select('id, name, start_time, created_at')
        .lte('start_time', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Format competitions data
      const formattedCompetitions = (liveCompData as any[] | undefined)?.map((comp: any) => ({
        id: comp?.id,
        title: comp?.name,
        message: 'Competition is starting soon!',
        created_at: comp?.created_at ?? comp?.start_time ?? new Date().toISOString(),
        type: 'competition',
        is_read: false
      })) || [];

      // Merge DB notifications first, then other sources
      const merged = [
        ...dbNotifs,
        ...formattedQuiz,
        ...formattedCompetitions,
      ];

      // Sort by created_at (newest first)
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Keep top 15 most recent
      const recentNotifications = merged.slice(0, 15);

      // If a lastNotificationCheck exists (persisted), treat any notification
      // with created_at <= lastNotificationCheck as read for local display
      // and unread count calculation. This avoids showing the "new" badge
      // after the user already viewed notifications when DB updates may be
      // blocked by RLS.
      const effective = recentNotifications.map(n => {
        try {
          const created = new Date(n.created_at);
          if (lastNotificationCheck && created <= lastNotificationCheck) {
            return { ...n, is_read: true };
          }
        } catch (err) {
          // ignore parse errors and keep original is_read
        }
        return n;
      });

      setNotifications(effective);

      // Calculate unread count using the effective is_read (local) value
      const unread = effective.filter(notif => !notif.is_read).length;
      setUnreadCount(unread);

      // Check for new notifications since last check (only those strictly newer)
      const newNotifications = effective.filter(notif => new Date(notif.created_at) > (lastNotificationCheck || new Date(0)));
      if (newNotifications.length > 0 && !notificationOpen) {
        setNewNotificationAlert(true);
        // Show toast for new notifications
        if (newNotifications.length === 1) {
          // toast.success(`New notification: ${newNotifications[0].title}`);
        } else {
          // toast.success(`${newNotifications.length} new notifications`);
        }
      }

      // Do NOT update last-seen here. We only persist last-seen when the
      // user actively opens/views notifications (see markNotificationsAsRead)
      // or clicks an individual notification. Updating it here would cause
      // fetches (e.g. on mount) to incorrectly advance the last-seen time.

    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark notifications as read when dropdown is opened
  const markNotificationsAsRead = async (userId: string) => {
    try {
      // Try to mark unread notifications as 'read' in the DB. If the UPDATE
      // fails due to RLS, fall back to updating local state only.
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id).filter(Boolean);
      if (unreadIds.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadIds);

        if (error) {
          console.warn('Failed to mark notifications read in DB (RLS?), falling back to local state:', error.message || error);
        } else {
            // Update local cache to reflect DB change - keep items visible but mark as read
            setNotifications(prev => prev.map(n => n.id ? { ...n, is_read: true } : n));
            setUnreadCount(0);
            setNewNotificationAlert(false);
            // Persist last-seen timestamp now that DB update succeeded
            try {
              const now = new Date();
              setLastNotificationCheck(now);
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('ke.notifications.lastSeenAt', now.toISOString());
              }
            } catch (err) { /* ignore */ }
          return;
        }
      }

      // Fallback: mark locally as read
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
      setNewNotificationAlert(false);

      // Persist last-seen timestamp so refresh doesn't trigger "new" badges
      try {
        const now = new Date();
        setLastNotificationCheck(now);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('ke.notifications.lastSeenAt', now.toISOString());
        }
      } catch (err) {
        // ignore storage errors
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Monitor auth state and fetch user data
  useEffect(() => {
    // Initialize lastNotificationCheck from localStorage to avoid marking
    // old notifications as "new" after a page refresh.
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const v = localStorage.getItem('ke.notifications.lastSeenAt');
        if (v) setLastNotificationCheck(new Date(v));
      }
    } catch (err) {
      // ignore
    }
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

        // Fetch marketing opt-in from profile and then notifications
        if (!profileError && profileData) {
          setMarketingOptIn(Boolean((profileData as any).marketing_opt_in));
        }
        // Fetch notifications for the user
        fetchNotifications(userId);

      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data");
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug('onAuthStateChange event', { event, session });
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

    const channel = supabase.channel(`notifications-user-${user.id}`);

    // Subscribe to INSERT and UPDATE events on public.notifications for this user
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
      const n = payload.new;
      // Ignore notifications that are already read
      // Respect marketing opt-in
      if (n.type === 'promotional' && !marketingOptIn) return;
      // Add new notification to the top, keep only the latest 3
      setNewNotificationAlert(true);
      const newNotif = {
        ...n,
        created_at: n.created_at || new Date().toISOString(),
        is_read: !!n.is_read,
      };
      setNotifications(prev => {
        const next = [newNotif, ...prev].slice(0, 3);
        setUnreadCount(next.filter((m: any) => !m.is_read).length);
        return next;
      });
      toast.success(n.title || 'New notification');
    });

    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
      const n = payload.new;
      // If updated notification is now read, remove it from the navbar list
      // Respect marketing opt-in
      if (n.type === 'promotional' && !marketingOptIn) {
        return;
      }
      // Update item in place (keep it visible)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, ...n } : x));
      setUnreadCount(prev => {
        const next = (prev && typeof prev === 'number') ? prev : 0;
        // Recalculate from notifications state after update
        return (notifications || []).filter((m: any) => !m.is_read).length;
      });
    });

    // Also subscribe to trophies/quiz events as secondary sources (optional)
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trophies', filter: `user_id=eq.${user.id}` }, () => {
      setNewNotificationAlert(true);
      fetchNotifications(user.id);
      toast.success('You earned a new trophy! 🏆');
    });

    (async () => {
      // Fetch initial notifications from DB + other sources
      fetchNotifications(user.id);

      // Subscribe and log subscription lifecycle for debugging
      try {
        channel.subscribe((status) => {
          console.debug('notifications channel subscription status:', status, 'channel:', `notifications-user-${user.id}`);
        });
      } catch (err) {
        console.error('Failed to subscribe to notifications channel:', err);
      }

      console.debug('Subscribed to notifications channel:', `notifications-user-${user.id}`);
    })();

    return () => { try { channel.unsubscribe(); } catch (e) { /* ignore */ } };
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

  // Handle hash changes and scroll to section on load
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const updateHash = () => {
      const hash = window.location.hash;
      setCurrentHash(hash);
      
      // Scroll to section if hash exists
      if (hash) {
        const sectionId = hash.replace('#', '');
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    };
    
    window.addEventListener("hashchange", updateHash);
    updateHash(); // Run on mount
    
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
    setMenuOpen(false);
    
    if (pathname !== "/") {
      // Navigate to home page with hash
      router.push(`/#${sectionId}`);
      // Wait for navigation and page load, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
      return;
    }
    
    // Already on home page, scroll immediately
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

  // Format unread badge count (cap at 9+ for small navbar badge)
  const formatBadgeCount = (count: number) => {
    if (!count || count <= 0) return '';
    if (count > 9) return '9+';
    return String(count);
  };

  // Handle click on a single notification in the navbar dropdown
  const handleNotificationItemClick = async (notif: any) => {
    if (!notif) return;

    // Close dropdown immediately for snappy UX
    setNotificationOpen(false);

    // Optimistic update: mark as read locally
    const prev = notifications;
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    setUnreadCount(u => Math.max(0, (u || 0) - (notif.is_read ? 0 : 1)));

    try {
      // Attempt to mark read in DB (if the table and permissions allow)
      if (notif.id && user) {
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
        if (error) {
          console.warn('Failed to mark notification as read in DB:', error);
        }
      }
    } catch (err) {
      console.error('Error updating notification read state:', err);
      // revert optimistic update
      setNotifications(prev);
      // Recalculate unread count from reverted state
      setUnreadCount((prev as any[]).filter(n => !n.is_read).length);
    }

    // Navigate to a link if provided, otherwise go to the notifications page
    try {
      const target = notif?.url || notif?.link || '/user_notifications';
      router.push(target);
    } catch (err) {
      console.error('Navigation error after clicking notification:', err);
    }
    // Persist last-seen timestamp after successful interaction
    try {
      const now = new Date();
      setLastNotificationCheck(now);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('ke.notifications.lastSeenAt', now.toISOString());
      }
    } catch (err) {
      // ignore storage errors
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

          </div>
        )}

        {/* Right Icons - Desktop */}
        <div className="hidden lg:flex items-center gap-6">
          {/* {role !== "admin" && (
            <div className="relative flex">
         
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

              <button
                onClick={toggleSearch}
                className={`text-gray-600 hover:text-lime-600 text-lg cursor-pointer transition-colors z-10 ${isOpen ? "text-lime-600" : ""
                  }`}
                aria-label="Search"
              >
                <FaSearch />
              </button>
            </div>
          )} */}

          {user && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleNotificationClick}
                className="text-gray-600 hover:text-lime-600 cursor-pointer mt-[7px] text-lg transition-colors relative focus:outline-none"
                aria-label="Notifications"
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 text-[11px] font-semibold">
                    {formatBadgeCount(unreadCount)}
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
                  <div className="py-1">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      // Show only the latest 3 notifications here
                      notifications.slice(0, 3).map((notif) => (
                        <div
                          key={notif.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleNotificationItemClick(notif)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationItemClick(notif); }}
                          className={`px-3 py-2 hover:bg-lime-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer ${!notif.is_read ? 'bg-lime-50' : ''}
                            `}
                        >
                          <div className="flex items-start gap-2">
                            {/* Notification Icon */}
                            <span className="text-base mt-0.5">
                              {getNotificationIcon(notif.type || 'default')}
                            </span>

                            {/* Notification Content */}
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 font-medium leading-tight">
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5 break-words leading-snug">
                                {notif.message}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-1">
                                {formatNotificationDate(notif.created_at)}
                              </p>
                            </div>

                            {/* Unread Dot */}
                            {!notif.is_read && (
                              <FaCircle className="text-lime-500 text-[10px] mt-1 animate-pulse" />
                            )}
                          </div>
                        </div>
                      ))
                    )}

                    {/* View more button */}
                    <div className="px-3 py-2 border-t border-gray-100 bg-white">
                      <Link
                        href="/user_notifications"
                        onClick={() => setNotificationOpen(false)}
                        className="w-full text-center block px-3 py-1.5 bg-lime-50 hover:bg-lime-100 text-lime-700 rounded-md font-medium text-sm"
                      >
                        View more
                      </Link>
                    </div>
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
                        href="/credits/manage"
                        className={`px-4 py-3 flex items-center transition-colors ${isActive("/credits/manage")
                          ? 'bg-lime-100 text-lime-700'
                          : 'text-gray-700 hover:bg-lime-50'
                          }`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="text-lg overflow-hidden mr-3">
                          <div className="w-full h-full flex items-center justify-center">
                            <Trophy className="text-lime-500 size-5" />
                          </div>
                        </div>
                        <span>Credit Balance</span>
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
                        href="/leaderboard"
                        className={`px-4 py-3 flex items-center transition-colors ${isActive("/leaderboard")
                          ? 'bg-lime-100 text-lime-700'
                          : 'text-gray-700 hover:bg-lime-50'
                          }`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Crown className="mr-3 text-lime-500 size-5" />
                        <span>Leaderboard</span>
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
                  href="/credits/manage"
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${isActive("/credits/manage")
                    ? "bg-lime-100 text-lime-700"
                    : "text-gray-700 hover:bg-lime-50"
                    }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5" />
                    <span>Credit Balance</span>
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