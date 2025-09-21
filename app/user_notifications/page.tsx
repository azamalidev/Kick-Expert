'use client';
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Trophy, FileText, Activity, CreditCard, Gift, Bell } from 'lucide-react';

export default function UserNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // Show 10 notifications at a time
  const [total, setTotal] = useState<number | null>(null);
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(false);
  const [savingOptIn, setSavingOptIn] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const filterContainerRef = useRef<HTMLDivElement | null>(null);

  // Filter definitions using lucide icons
  const filters = [
    { id: 'all', label: 'All', Icon: Bell },
    { id: 'trophy', label: 'Achievements', Icon: Trophy },
    { id: 'quiz', label: 'Quizzes', Icon: FileText },
    { id: 'competition', label: 'Competitions', Icon: Activity },
    { id: 'transactional', label: 'Transactions', Icon: CreditCard },
    { id: 'promotional', label: 'Promotions', Icon: Gift },
  ];

  // Ensure filter bar is scrolled to left on mount
  useEffect(() => {
    if (filterContainerRef.current) filterContainerRef.current.scrollLeft = 0;
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to view notifications');
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Load profile first so we know marketing opt-in preference
      await fetchUserProfile(user.id);

      // Now load notifications respecting marketing opt-in
      await fetchNotifications(user.id, 1);
      setLoading(false);

      // subscribe to realtime (filter server-side by user_id, but respect opt-in client-side)
      const channel = supabase.channel(`notifications-inbox-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
          const n = payload.new;
          // If promotional notifications are disabled by user, ignore promotional payloads
          if (n.type === 'promotional' && !marketingOptIn) return;
          setNotifications(prev => [n, ...prev]);
          toast.success(n.title || 'New notification');
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
          const n = payload.new;
          // If promotional and user opted-out, remove it from the list if present
          if (n.type === 'promotional' && !marketingOptIn) {
            setNotifications(prev => prev.filter(x => x.id !== n.id));
            return;
          }
          setNotifications(prev => prev.map(x => x.id === n.id ? n : x));
        });
      channel.subscribe();
      return () => { try { channel.unsubscribe(); } catch (e) { } };
    };
    init();
  }, []);

  const fetchUserProfile = async (id: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('marketing_opt_in').eq('user_id', id).single();
      if (!error && data) setMarketingOptIn(Boolean((data as any).marketing_opt_in));
    } catch (err) { /* ignore */ }
  };

  const fetchNotifications = async (id: string, pageToLoad: number) => {
    setLoading(true);
    try {
      const from = (pageToLoad - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .range(from, to);

      // If the user has not opted-in to promotional notifications, exclude them from results
      if (!marketingOptIn) {
        query = (query as any).neq('type', 'promotional');
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setNotifications(data || []);
      setTotal(count ?? null);
      setPage(pageToLoad);
    } catch (error) {
      console.error('Failed to load notifications', error);
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  const toggleRead = async (notifId: string, markRead: boolean) => {
    // Optimistic UI: update the local notification immediately
    const previous = notifications;
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: markRead } : n));

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: markRead })
        .eq('id', notifId);
      if (error) throw error;
      // success: nothing more to do (local state already updated)
    } catch (err) {
      console.error('Failed to update', err);
      // revert optimistic update
      setNotifications(previous);
      toast.error('Could not update notification');
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked read');
    } catch (err) {
      console.error('Failed mark all read', err);
      toast.error('Could not mark all as read');
    }
  };

  const saveMarketingOptIn = async () => {
    if (!userId) return;
    setSavingOptIn(true);
    try {
      const { error } = await supabase.from('profiles').upsert({ user_id: userId, marketing_opt_in: marketingOptIn }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Preferences saved');
      // Refresh notifications to reflect new preference
      await fetchNotifications(userId, 1);
    } catch (err) {
      console.error('Failed to save opt-in', err);
      toast.error('Could not save preference');
    } finally {
      setSavingOptIn(false);
    }
  };

  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter);

  const totalPages = total ? Math.ceil(total / pageSize) : null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">Stay updated with your latest activities</p>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
           
              <Link 
                href="/profile" 
                className="px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Profile
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {/* Filter Section - Moved to top */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Filter Notifications</h4>
                <p className="text-gray-600 text-sm mb-4">Show notifications by type</p>
                
                <div
                  ref={filterContainerRef}
                  className="flex gap-2 overflow-x-auto flex-nowrap py-2 px-1 scrollbar-hide"
                >
                  {filters.map((filter) => {
                    const Icon = filter.Icon;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                          activeFilter === filter.id
                            ? 'bg-lime-100 text-lime-800 border-lime-500 border'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium whitespace-nowrap">{filter.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notifications Container with Fixed Height */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Your Notifications</h2>
                  <span className="text-sm text-gray-500">
                    {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
                  </span>
                </div>
                
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                    <p className="text-gray-500">We'll notify you when something arrives.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                    {filteredNotifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-6 transition-all duration-200 hover:bg-gray-50 ${!n.is_read ? 'bg-lime-50 hover:bg-lime-100' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${getBgColorForType(n.type)}`}>
                            {getIconForType(n.type)}
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">{n.title}</h3>
                              <span className="text-xs text-gray-500">{formatDate(n.created_at)}</span>
                            </div>
                            <p className="mt-2 text-gray-700">{n.message}</p>
                     
                          </div>
                          <div className="ml-4">
                            <button 
                              onClick={() => toggleRead(n.id, !n.is_read)} 
                              className={`p-2 rounded-full ${n.is_read ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-200' : 'text-lime-600 hover:text-lime-700 hover:bg-lime-200'}`}
                              title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                            >
                              {n.is_read ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages && totalPages > 1 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, total || 0)}</span> of <span className="font-medium">{total}</span> results
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => fetchNotifications(userId!, page - 1)} 
                          disabled={page <= 1}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Previous
                        </button>
                        <span className="px-2 text-sm text-gray-700">Page {page} of {totalPages}</span>
                        <button 
                          onClick={() => fetchNotifications(userId!, page + 1)} 
                          disabled={page >= (totalPages || 1)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h4>
                <p className="text-gray-600 text-sm mb-4">Control how you receive notifications from us.</p>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-800">Promotional Notifications</p>
                    <p className="text-xs text-gray-500 mt-1">Special tournaments and campaigns</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={marketingOptIn} 
                      onChange={(e) => setMarketingOptIn(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500"></div>
                  </label>
                </div>
                
                <button 
                  onClick={saveMarketingOptIn} 
                  disabled={savingOptIn}
                  className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {savingOptIn ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2"><svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg> Save Preferences</span>
                  )}
                </button>
              </div>

              {/* <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Notification Tips</h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-lime-500 mr-2">•</span>
                    <span>Click the bell icon to mark notifications as read/unread</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-lime-500 mr-2">•</span>
                    <span>Unread notifications have a light green background</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-lime-500 mr-2">•</span>
                    <span>Use filters to see specific types of notifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-lime-500 mr-2">•</span>
                    <span>Scroll to see more notifications</span>
                  </li>
                </ul>
              </div> */}
            </aside>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}

// Helper utilities for the page
function formatDate(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function getIconForType(type: string) {
  switch (type) {
    case 'trophy': return '🏆';
    case 'quiz': return '📝';
    case 'competition': return '⚽';
    case 'transactional': return '💳';
    case 'promotional': return '🎉';
    default: return '🔔';
  }
}

function getBgColorForType(type: string) {
  switch (type) {
    case 'trophy': return 'bg-amber-100 text-amber-700';
    case 'quiz': return 'bg-blue-100 text-blue-700';
    case 'competition': return 'bg-emerald-100 text-emerald-700';
    case 'transactional': return 'bg-purple-100 text-purple-700';
    case 'promotional': return 'bg-pink-100 text-pink-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}