"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiBell, FiCheck, FiAlertCircle, FiDollarSign, FiUser, FiChevronDown, FiPlus, FiX, FiMail, FiInbox, FiSettings } from 'react-icons/fi';
import { supabase } from '@/lib/supabaseClient';

type Notification = {
  id: number;
  date: string;
  time: string;
  type: 'Support' | 'Wallet' | 'System' | 'Game' | 'Info' | 'Alert' | 'Marketing' | 'Referral';
  message: string;
  details: string;
  status: 'Unread' | 'Read';
  userId?: string;
  amount?: number;
};

type UserPreferences = {
  emailNotifications: boolean;
  marketingEmails: boolean;
  referralEmails: boolean;
};

const Notifications: React.FC = () => {
  const initialNotifications: Notification[] = [];

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedDate, setSelectedDate] = useState<string>('All Dates');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [broadcastsTabOpen, setBroadcastsTabOpen] = useState(false);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);

  const [newNotification, setNewNotification] = useState({
    recipient: 'All Users',
    subject: '',
    message: '',
    type: 'Info',
    deliveryMethod: ['In-App'] as string[],
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    marketingEmails: true,
    referralEmails: true,
  });

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('userNotificationPreferences') : null;
    if (saved) setUserPreferences(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('userNotificationPreferences', JSON.stringify(userPreferences));
  }, [userPreferences]);

  const loadBroadcasts = async () => {
    try {
      // Get current session token from Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error('You must be signed in as an admin to view broadcasts');
        return;
      }

      const res = await fetch('/api/admin/broadcasts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load broadcasts');
      const data = await res.json();
      setBroadcasts(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load broadcasts');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = selectedType === 'All Types' || notification.type === selectedType;
    const matchesStatus = selectedStatus === 'All Statuses' || notification.status === selectedStatus;
    const matchesDate = selectedDate === 'All Dates' || notification.date === selectedDate;
    return matchesType && matchesStatus && matchesDate;
  });

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Read' } : n));
  };

  const toggleDetails = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
    markAsRead(id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Support': return <FiAlertCircle className="text-yellow-600 text-lg" />;
      case 'Wallet': return <FiDollarSign className="text-green-600 text-lg" />;
      case 'System': return <FiBell className="text-blue-600 text-lg" />;
      case 'Game': return <FiUser className="text-purple-600 text-lg" />;
      case 'Alert': return <FiAlertCircle className="text-red-600 text-lg" />;
      case 'Marketing': return <FiMail className="text-pink-600 text-lg" />;
      case 'Referral': return <FiUser className="text-indigo-600 text-lg" />;
      default: return <FiBell className="text-gray-600 text-lg" />;
    }
  };

  const getTypeBadgeClass = (type: Notification['type']) => {
    switch (type) {
      case 'Support': return 'bg-yellow-100 text-yellow-800';
      case 'Wallet': return 'bg-green-100 text-green-800';
      case 'System': return 'bg-blue-100 text-blue-800';
      case 'Game': return 'bg-purple-100 text-purple-800';
      case 'Alert': return 'bg-red-100 text-red-800';
      case 'Marketing': return 'bg-pink-100 text-pink-800';
      case 'Referral': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateHeader = (date: string) => {
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
    if (date === today) return 'Today';
    if (date === yesterday) return 'Yesterday';
    return date;
  };

  const handleCreateNotification = async () => {
    try {
      // Get current session token from Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error('You must be signed in as an admin to send notifications');
        return;
      }

      const payload = {
        title: newNotification.subject,
        message: newNotification.message,
        type: newNotification.type,
        priority: 'medium',
        cta_url: null,
        is_banner: false,
        expiry_date: null,
        target: { audience: newNotification.recipient },
        send_now: true,
      } as any;

      const res = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        // prefer the Supabase session token (keeps auth consistent across the app)
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error || 'Failed');
      }
      toast.success('Broadcast queued');
      setIsCreateModalOpen(false);
      setNewNotification({ recipient: 'All Users', subject: '', message: '', type: 'Info', deliveryMethod: ['In-App'] });
      loadBroadcasts();
    } catch (err: any) {
      console.error(err);
      toast.error('Broadcast failed: ' + (err?.message || 'unknown'));
    }
  };

  const toggleDeliveryMethod = (method: string) => {
    setNewNotification(prev => {
      const methods = [...prev.deliveryMethod];
      if (methods.includes(method)) return { ...prev, deliveryMethod: methods.filter(m => m !== method) };
      return { ...prev, deliveryMethod: [...methods, method] };
    });
  };

  const handlePreferenceChange = (key: keyof UserPreferences) => {
    setUserPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification preferences updated');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Notifications</h1>
              <p className="text-gray-600 mt-1">Manage system and user notifications</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium flex items-center">
                <FiBell className="mr-1" />
                {notifications.filter(n => n.status === 'Unread').length} Unread
              </span>
              <button onClick={() => setIsSettingsModalOpen(true)} className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-md"><FiSettings /><span>Notification Settings</span></button>
              <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"><FiPlus /><span>Create Notification</span></button>
              <button onClick={() => { setBroadcastsTabOpen(prev => { const next = !prev; if (next) loadBroadcasts(); return next; }); }} className="flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors shadow-md"><FiInbox /><span>Broadcasts</span></button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Type</label>
                <select className="w-full pl-4 pr-10 py-3 text-base border-gray-300 rounded-lg bg-gray-50 border" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                  <option>All Types</option>
                  <option>Support</option>
                  <option>Wallet</option>
                  <option>System</option>
                  <option>Game</option>
                  <option>Info</option>
                  <option>Alert</option>
                  <option>Marketing</option>
                  <option>Referral</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Status</label>
                <select className="w-full pl-4 pr-10 py-3 text-base border-gray-300 rounded-lg bg-gray-50 border" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option>All Statuses</option>
                  <option>Unread</option>
                  <option>Read</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Date</label>
                <select className="w-full pl-4 pr-10 py-3 text-base border-gray-300 rounded-lg bg-gray-50 border" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                  <option>All Dates</option>
                  {Array.from(new Set(notifications.map(n => n.date))).map(date => (
                    <option key={date} value={date}>{formatDateHeader(date)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {broadcastsTabOpen ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
              <h3 className="text-lg font-semibold mb-4">Broadcasts</h3>
              {broadcasts.length === 0 ? (
                <p className="text-sm text-gray-500">No broadcasts yet.</p>
              ) : (
                <div className="space-y-4">
                  {broadcasts.map(b => (
                    <div key={b.broadcast_id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{b.title}</h4>
                          <p className="text-sm text-gray-600">{b.message}</p>
                          <div className="text-xs text-gray-500 mt-2">Scheduled: {b.schedule_at || 'Immediate'} · Status: {b.status}</div>
                        </div>
                        <div className="text-right text-sm text-gray-700">
                          <div>Recipients: {b.recipients}</div>
                          <div>Delivered: {b.delivered}</div>
                          <div>Opened: {b.opened}</div>
                          <div>Clicked: {b.clicked}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification, index) => {
                    const showDateHeader = index === 0 || filteredNotifications[index - 1].date !== notification.date;
                    return (
                      <React.Fragment key={notification.id}>
                        {showDateHeader && (
                          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700">{formatDateHeader(notification.date)}</h3>
                          </div>
                        )}
                        <div className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${notification.status === 'Unread' ? 'bg-blue-50' : ''}`} onClick={() => toggleDetails(notification.id)}>
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 pt-1">{getTypeIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-gray-900">{notification.message}</h3>
                                <span className="text-sm text-gray-500 whitespace-nowrap ml-4">{notification.time}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getTypeBadgeClass(notification.type)}`}>{notification.type}</span>
                                <span className={"text-sm px-3 py-1 rounded-full font-medium " + (notification.status === 'Unread' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800')}>{notification.status}</span>
                              </div>
                            </div>
                            <FiChevronDown className={`ml-2 flex-shrink-0 h-6 w-6 text-gray-400 transition-transform ${expandedId === notification.id ? 'transform rotate-180' : ''}`} />
                          </div>

                          {expandedId === notification.id && (
                            <div className="mt-4 pl-10 space-y-4">
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-base text-gray-700 whitespace-pre-line">{notification.details}</p>
                                {notification.amount && (
                                  <div className="mt-3 flex items-center text-base text-gray-600"><FiDollarSign className="mr-2" /> <span>Amount: ${notification.amount.toFixed(2)}</span></div>
                                )}
                                {notification.userId && (
                                  <div className="mt-2 flex items-center text-base text-gray-600"><FiUser className="mr-2" /> <span>User ID: {notification.userId}</span></div>
                                )}
                              </div>
                              <div className="flex justify-end">
                                {notification.status === 'Unread' && (
                                  <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                    <FiCheck className="mr-2" /> Mark as Read
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center"><p className="text-gray-500 text-lg">No notifications found matching your criteria.</p></div>
              )}
            </div>
          )}

          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800">Create User Notification</h2>
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><FiX className="text-xl text-gray-500"/></button>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Recipient</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg" value={newNotification.recipient} onChange={(e) => setNewNotification({ ...newNotification, recipient: e.target.value })}>
                      <option>All Users</option>
                      <option>Premium Users</option>
                      <option>New Users</option>
                      <option>Specific User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Subject</label>
                    <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Subject" value={newNotification.subject} onChange={(e) => setNewNotification({ ...newNotification, subject: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Message</label>
                    <textarea className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px]" placeholder="Message" value={newNotification.message} onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Delivery Method</label>
                    <div className="flex gap-4">
                      {['In-App', 'Email', 'SMS'].map(m => (
                        <label key={m} className="flex items-center space-x-2"><input type="checkbox" checked={newNotification.deliveryMethod.includes(m)} onChange={() => toggleDeliveryMethod(m)} /> <span>{m}</span></label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end p-6 border-t border-gray-200">
                  <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
                  <button onClick={handleCreateNotification} disabled={!newNotification.subject || !newNotification.message} className="ml-3 px-6 py-3 rounded-lg bg-indigo-600 text-white">Send Notification</button>
                </div>
              </div>
            </div>
          )}

          {isSettingsModalOpen && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800">Notification Settings</h2>
                  <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><FiX className="text-xl text-gray-500"/></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive all email notifications</p>
                    </div>
                    <input type="checkbox" checked={userPreferences.emailNotifications} onChange={() => handlePreferenceChange('emailNotifications')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Marketing Emails</h3>
                      <p className="text-sm text-gray-600">Receive promotional offers and updates</p>
                    </div>
                    <input type="checkbox" checked={userPreferences.marketingEmails} onChange={() => handlePreferenceChange('marketingEmails')} disabled={!userPreferences.emailNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Referral Emails</h3>
                      <p className="text-sm text-gray-600">Receive referral program updates</p>
                    </div>
                    <input type="checkbox" checked={userPreferences.referralEmails} onChange={() => handlePreferenceChange('referralEmails')} disabled={!userPreferences.emailNotifications} />
                  </div>
                </div>
                <div className="flex justify-end p-6 border-t border-gray-200"><button onClick={() => setIsSettingsModalOpen(false)} className="px-6 py-3 bg-indigo-600 text-white rounded-lg">Done</button></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;