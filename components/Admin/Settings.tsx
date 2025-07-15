import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiSave, FiUser, FiShield, FiHeadphones, FiClock, FiSettings, FiDollarSign, FiActivity, FiEdit, FiAlertCircle, FiDatabase, FiServer } from 'react-icons/fi';

const AdminSettings = () => {
  // System Banner State
  const [bannerText, setBannerText] = useState('Maintenance scheduled for Sunday at 2 AM UTC, June 29, 2025');
  const [isEditingBanner, setIsEditingBanner] = useState(false);

  // System Logs (dummy data)
  const systemLogs = [
    { id: 1, date: '2025-06-23 14:30:22', type: 'System', message: 'Completed database backup', severity: 'Info' },
    { id: 2, date: '2025-06-23 12:15:08', type: 'Auth', message: 'User login failed (3 attempts)', severity: 'Warning' },
    { id: 3, date: '2025-06-23 09:45:33', type: 'Payment', message: 'Processed 12 transactions', severity: 'Info' },
    { id: 4, date: '2025-06-22 23:10:17', type: 'System', message: 'Memory usage high (85%)', severity: 'Warning' },
    { id: 5, date: '2025-06-22 18:22:45', type: 'API', message: 'External API timeout', severity: 'Error' },
  ];

  // Update banner text
  const handleBannerUpdate = () => {
    setIsEditingBanner(false);
    toast.success('System banner updated successfully!');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return new Date(dateString.replace(' ', 'T')).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <FiSettings className="text-3xl text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">System Settings & Logs</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage system configuration and view activity logs as of 09:30 PM PKT, June 23, 2025</p>
            </div>
          </div>

          {/* System Banner Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                <FiAlertTriangle className="mr-2 text-yellow-500" />
                System Banner
              </h2>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Announcement Text
                  </label>
                  {isEditingBanner ? (
                    <div className="space-y-4">
                      <textarea
                        className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                        rows={3}
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        placeholder="Enter announcement text..."
                      />
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                          onClick={() => setIsEditingBanner(false)}
                          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBannerUpdate}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center text-sm sm:text-base"
                        >
                          <FiSave className="mr-2" />
                          Update Banner
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-100 rounded-lg w-full mb-2 sm:mb-0">
                        <p className="text-gray-800 text-sm sm:text-base">{bannerText}</p>
                      </div>
                      <button
                        onClick={() => setIsEditingBanner(true)}
                        className="w-full sm:w-auto ml-0 sm:ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap flex items-center text-sm sm:text-base"
                      >
                        <FiEdit className="mr-2" />
                        Edit Banner
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* System Logs Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                <FiActivity className="mr-2 text-indigo-500" />
                System Logs
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {systemLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiClock className="flex-shrink-0 mr-2 text-gray-400" />
                          <span className="text-sm sm:text-base text-gray-900">{formatDate(log.date)}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm sm:text-base text-gray-500">
                        <div className="flex items-center">
                          {log.type === 'System' && <FiServer className="mr-2 text-gray-400" />}
                          {log.type === 'Auth' && <FiAlertCircle className="mr-2 text-gray-400" />}
                          {log.type === 'Payment' && <FiDollarSign className="mr-2 text-gray-400" />}
                          {log.type === 'API' && <FiDatabase className="mr-2 text-gray-400" />}
                          {log.type}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm sm:text-base text-gray-900 max-w-xs sm:max-w-md">{log.message}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          log.severity === 'Error' ? 'bg-red-100 text-red-800' :
                          log.severity === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Roles Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                <FiUser className="mr-2 text-indigo-500" />
                Admin Roles
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <FiShield className="text-red-500 mr-2 sm:mr-3 text-lg sm:text-xl" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">super_admin@kickexpert.com</p>
                      <p className="text-sm text-gray-500  sm:text-sm">Super Admin</p>
                    </div>
                  </div>
                  <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm font-medium">
                    Full Access
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <FiShield className="text-blue-500 mr-2 sm:mr-3 text-lg sm:text-xl" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">admin@kickexpert.com</p>
                      <p className="text-sm text-gray-500  sm:text-sm">Admin</p>
                    </div>
                  </div>
                  <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
                    Elevated Access
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <FiHeadphones className="text-green-500 mr-2 sm:mr-3 text-lg sm:text-xl" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">support_lead@kickexpert.com</p>
                      <p className="text-sm text-gray-500  sm:text-sm">Support Lead</p>
                    </div>
                  </div>
                  <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                    Support Access
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;