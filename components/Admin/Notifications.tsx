import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiBell, FiCheck, FiAlertCircle, FiDollarSign, FiUser, FiClock, FiChevronDown, FiPlus, FiX, FiMail, FiInbox } from 'react-icons/fi';

type Notification = {
  id: number;
  date: string;
  time: string;
  type: 'Support' | 'Wallet' | 'System' | 'Game' | 'Info' | 'Alert';
  message: string;
  details: string;
  status: 'Unread' | 'Read';
  userId?: string;
  amount?: number;
};

const Notifications = () => {
  // Sample notification data
  const initialNotifications: Notification[] = [
    {
      id: 1,
      date: '6/23/2025',
      time: '7:39:56 PM',
      type: 'Support',
      message: 'New support ticket from Player104',
      details: 'Player104 is reporting a login issue after password reset.',
      status: 'Unread'
    },
    {
      id: 2,
      date: '6/23/2025',
      time: '7:14:56 PM',
      type: 'Wallet',
      message: '$30 withdrawal requested by Player203',
      details: 'Player203 (user_id: user_abc123) requested a $30 withdrawal to PayPal account.',
      status: 'Unread',
      amount: 30,
      userId: 'user_abc123'
    },
    {
      id: 3,
      date: '6/22/2025',
      time: '3:45:21 PM',
      type: 'Game',
      message: 'New high score recorded',
      details: 'Player302 achieved a new high score of 9,850 in Trivia Challenge.',
      status: 'Read'
    },
    {
      id: 4,
      date: '6/22/2025',
      time: '11:20:10 AM',
      type: 'System',
      message: 'Scheduled maintenance',
      details: 'System maintenance scheduled for June 24th from 2:00 AM to 4:00 AM UTC.',
      status: 'Read'
    },
    {
      id: 5,
      date: '6/21/2025',
      time: '9:15:33 PM',
      type: 'Wallet',
      message: '$150 deposit from Player401',
      details: 'Player401 deposited $150 via credit card (Transaction ID: TXN789012).',
      status: 'Read',
      amount: 150,
      userId: 'user_xyz456'
    },
    {
      id: 6,
      date: '6/20/2025',
      time: '5:55:12 PM',
      type: 'Support',
      message: 'Ticket #4567 resolved',
      details: 'Support ticket regarding payment issue has been resolved.',
      status: 'Read'
    }
  ];

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedDate, setSelectedDate] = useState<string>('All Dates');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    recipient: 'All Users',
    subject: '',
    message: '',
    type: 'Info',
    deliveryMethod: ['In-App']
  });

  // Filter notifications based on selections
  const filteredNotifications = notifications.filter(notification => {
    const matchesType = selectedType === 'All Types' || notification.type === selectedType;
    const matchesStatus = selectedStatus === 'All Statuses' || notification.status === selectedStatus;
    const matchesDate = selectedDate === 'All Dates' || notification.date === selectedDate;
    
    return matchesType && matchesStatus && matchesDate;
  });

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, status: 'Read' } : notification
    ));
  };

  // Toggle notification details
  const toggleDetails = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
    if (expandedId !== id) {
      markAsRead(id);
    }
  };

  // Get icon based on notification type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Support': return <FiAlertCircle className="text-yellow-600 text-lg" />;
      case 'Wallet': return <FiDollarSign className="text-green-600 text-lg" />;
      case 'System': return <FiBell className="text-blue-600 text-lg" />;
      case 'Game': return <FiUser className="text-purple-600 text-lg" />;
      case 'Alert': return <FiAlertCircle className="text-red-600 text-lg" />;
      default: return <FiBell className="text-gray-600 text-lg" />;
    }
  };

  // Format date header
  const formatDateHeader = (date: string) => {
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
    
    if (date === today) return 'Today';
    if (date === yesterday) return 'Yesterday';
    return date;
  };

  // Handle create notification
  const handleCreateNotification = () => {
    const newId = Math.max(...notifications.map(n => n.id)) + 1;
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const adminNotification: Notification = {
      id: newId,
      date: currentDate,
      time: currentTime,
      type: newNotification.type as any,
      message: newNotification.subject,
      details: newNotification.message,
      status: 'Read'
    };

    setNotifications([adminNotification, ...notifications]);
    setIsCreateModalOpen(false);
    setNewNotification({
      recipient: 'All Users',
      subject: '',
      message: '',
      type: 'Info',
      deliveryMethod: ['In-App']
    });

    // In a real app, you would send this to users via the selected delivery method
    toast.success(`Notification sent to ${newNotification.recipient} `);
  };

  // Toggle delivery method
  const toggleDeliveryMethod = (method: string) => {
    setNewNotification(prev => {
      const methods = [...prev.deliveryMethod];
      if (methods.includes(method)) {
        return {
          ...prev,
          deliveryMethod: methods.filter(m => m !== method)
        };
      } else {
        return {
          ...prev,
          deliveryMethod: [...methods, method]
        };
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col space-y-6">
          {/* Header */}
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
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              >
                <FiPlus />
                <span>Create Notification</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Type</label>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg bg-gray-50 border"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option>All Types</option>
                    <option>Support</option>
                    <option>Wallet</option>
                    <option>System</option>
                    <option>Game</option>
                    <option>Info</option>
                    <option>Alert</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Status</label>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg bg-gray-50 border"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option>All Statuses</option>
                    <option>Unread</option>
                    <option>Read</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Date</label>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg bg-gray-50 border"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    <option>All Dates</option>
                    {Array.from(new Set(notifications.map(n => n.date))).map(date => (
                      <option key={date} value={date}>{formatDateHeader(date)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification, index) => {
                  const showDateHeader = index === 0 || 
                    filteredNotifications[index - 1].date !== notification.date;
                  
                  return (
                    <React.Fragment key={notification.id}>
                      {showDateHeader && (
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-700">
                            {formatDateHeader(notification.date)}
                          </h3>
                        </div>
                      )}
                      <div 
                        className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                          notification.status === 'Unread' ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleDetails(notification.id)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 pt-1">
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {notification.message}
                              </h3>
                              <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                                {notification.time}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                                notification.type === 'Support' ? 'bg-yellow-100 text-yellow-800' :
                                notification.type === 'Wallet' ? 'bg-green-100 text-green-800' :
                                notification.type === 'System' ? 'bg-blue-100 text-blue-800' :
                                notification.type === 'Game' ? 'bg-purple-100 text-purple-800' :
                                notification.type === 'Alert' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {notification.type}
                              </span>
                              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                                notification.status === 'Unread' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {notification.status}
                              </span>
                            </div>
                          </div>
                          <FiChevronDown 
                            className={`ml-2 flex-shrink-0 h-6 w-6 text-gray-400 transition-transform ${
                              expandedId === notification.id ? 'transform rotate-180' : ''
                            }`}
                          />
                        </div>
                        
                        {expandedId === notification.id && (
                          <div className="mt-4 pl-10 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <p className="text-base text-gray-700 whitespace-pre-line">
                                {notification.details}
                              </p>
                              {notification.amount && (
                                <div className="mt-3 flex items-center text-base text-gray-600">
                                  <FiDollarSign className="mr-2" />
                                  <span>Amount: ${notification.amount.toFixed(2)}</span>
                                </div>
                              )}
                              {notification.userId && (
                                <div className="mt-2 flex items-center text-base text-gray-600">
                                  <FiUser className="mr-2" />
                                  <span>User ID: {notification.userId}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end">
                              {notification.status === 'Unread' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <FiCheck className="mr-2" />
                                  Mark as Read
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
              <div className="p-8 text-center">
                <p className="text-gray-500 text-lg">No notifications found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Notification Modal */}
      {isCreateModalOpen && (
        <div className="fixed  inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white  rounded-xl shadow-2xl w-full max-w-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Create User Notification</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiX className="text-xl text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* <p className="text-gray-600">
                Compose a notification to send to users. This will be logged.
              </p> */}

              <div className="space-y-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Recipient</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={newNotification.recipient}
                    onChange={(e) => setNewNotification({...newNotification, recipient: e.target.value})}
                  >
                    <option>All Users</option>
                    <option>Premium Users</option>
                    <option>New Users</option>
                    <option>Specific User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Weekend Tournament Update"
                    value={newNotification.subject}
                    onChange={(e) => setNewNotification({...newNotification, subject: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                    placeholder="Detailed message content..."
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  />
                </div>

                {/* <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Notification Type</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                  >
                    <option value="Info">Info</option>
                    <option value="Alert">Alert</option>
                    <option value="System">System</option>
                  </select>
                </div> */}

              
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotification}
                disabled={!newNotification.subject || !newNotification.message}
                className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                  !newNotification.subject || !newNotification.message 
                    ? 'bg-indigo-300 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;