'use client';

import React from 'react';

interface DeviceSwitchModalProps {
  isOpen: boolean;
  deviceInfo: {
    browser?: string;
    os?: string;
    deviceType?: string;
    loginTime?: string;
    lastActive?: string;
  };
  onCancel: () => void;
  onLoginAnyway: () => void;
  isLoading?: boolean;
}

const DeviceSwitchModal: React.FC<DeviceSwitchModalProps> = ({
  isOpen,
  deviceInfo,
  onCancel,
  onLoginAnyway,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-xs">
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-yellow-500/30 overflow-hidden">
        {/* Header with gradient accent */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-6 border-b border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Already Logged In
              </h3>
              <p className="text-sm text-gray-400">Another device is active</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">
            Your account is currently logged in on another device. Logging in here will automatically log you out from the other device.
          </p>

          {/* Device Info Card */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 space-y-2">
            <h4 className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-3">
              Current Session
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Device Type</p>
                <p className="text-white font-medium">
                  {deviceInfo.deviceType || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Browser</p>
                <p className="text-white font-medium">
                  {deviceInfo.browser || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Operating System</p>
                <p className="text-white font-medium">
                  {deviceInfo.os || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Last Active</p>
                <p className="text-white font-medium">
                  {formatDate(deviceInfo.lastActive)}
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-3">
            <svg
              className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-yellow-200 text-xs leading-relaxed">
              If you did not initiate this login, please secure your account immediately by changing your password.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-800/30 border-t border-gray-700/50 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onLoginAnyway}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                <span>Logging In...</span>
              </>
            ) : (
              'Login Anyway'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceSwitchModal;
