'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "react-icons/fa";
import { MdMenu, MdClose, MdDashboard } from "react-icons/md";
import { Bot, Target, Trophy } from "lucide-react";
import { SupabaseUser } from '@/types/user';

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [currentHash, setCurrentHash] = useState<string>("");

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
          return;
        }

        const userData = data as SupabaseUser;
        setUserName(userData.name || "User");
        setRole(userData.role || "user");
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data");
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser.id);
      } else {
        setUserName("");
        setRole("");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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

  // Handle hash changes for scroll navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateHash = () => setCurrentHash(window.location.hash);

    window.addEventListener("hashchange", updateHash);
    updateHash();

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const toggleSearch = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
      setDropdownOpen(false);
      setNotificationOpen(false);
      setMenuOpen(false);
    } catch (error: any) {
      console.error("Logout Error:", error.message);
      toast.error("Failed to log out");
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (pathname !== "/") {
      window.location.href = `/#${sectionId}`;
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setMenuOpen(false);
  };

  // Check if a nav item is active
  const isActive = (href: string, section?: string) => {
    if (section && pathname === "/") {
      return currentHash === `#${section}`;
    }
    return pathname === href;
  };

  return (
    <nav className="bg-white w-full z-50 shadow-sm fixed top-0">
      <div className="flex justify-between items-center px-4 py-3 md:px-8 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="w-8 h-8 md:w-10 md:h-10"
            />
            <span className="ml-2 text-lime-400 font-bold text-lg md:text-xl">
              Kick<span className="text-black">Expert</span>
            </span>
          </div>
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
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="text-gray-600 hover:text-lime-600 cursor-pointer mt-[7px] text-lg transition-colors relative"
                aria-label="Notifications"
              >
                <FaBell />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                  3
                </span>
              </button>
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-lime-50 text-gray-700 font-medium border-b border-gray-200">
                    Notifications
                  </div>
                  <div className="px-4 py-3 hover:bg-lime-50 transition-colors">
                    <p className="text-sm text-gray-700">New quiz available!</p>
                    <p className="text-xs text-gray-500">5 minutes ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-lime-50 transition-colors">
                    <p className="text-sm text-gray-700">Competition starting soon!</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-lime-50 transition-colors">
                    <p className="text-sm text-gray-700">You earned a new badge!</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
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
                <div className="p-1 rounded-full text-lime-600 transition-colors">
                  <FaUser className="text-xl" />
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
                        <FaUserCircle className="mr-3 text-lime-500 text-lg" />
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
                    <FaUserCircle className="w-5 h-5" />
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