'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, CheckCircle, Clock, MessageSquare, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ContactStatus {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

function TrackContactContent() {
  const searchParams = useSearchParams();
  const urlId = searchParams ? searchParams.get('id') : null;

  const [contactId, setContactId] = useState(urlId || '');
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<ContactStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlId) {
      handleSearch(urlId);
    }
  }, [urlId]);

  const handleSearch = async (id: string = contactId) => {
    if (!id.trim()) {
      toast.error('Please enter a reference ID');
      return;
    }

    setLoading(true);
    setError('');
    setContact(null);

    try {
      const response = await fetch(`/api/contacts/status?id=${id.trim()}`);
      const data = await response.json();

      if (data.success && data.contact) {
        setContact(data.contact);
      } else {
        setError(data.error || 'Contact not found');
        toast.error('No contact found with this reference ID');
      }
    } catch (err) {
      console.error('Error fetching contact:', err);
      setError('Failed to fetch contact status');
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new':
        return {
          color: 'text-blue-800',
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          icon: <Clock className="w-6 h-6 text-blue-600" />,
          label: 'New',
          description: 'Your message has been received and is awaiting review',
        };
      case 'open':
        return {
          color: 'text-yellow-800',
          bg: 'bg-yellow-100',
          border: 'border-yellow-500',
          icon: <MessageSquare className="w-6 h-6 text-yellow-600" />,
          label: 'Open',
          description: 'We are currently reviewing your inquiry',
        };
      case 'in_progress':
        return {
          color: 'text-purple-800',
          bg: 'bg-purple-100',
          border: 'border-purple-500',
          icon: <AlertCircle className="w-6 h-6 text-purple-600" />,
          label: 'In Progress',
          description: 'Our team is actively working on your inquiry',
        };
      case 'resolved':
        return {
          color: 'text-green-800',
          bg: 'bg-green-100',
          border: 'border-green-500',
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          label: 'Resolved',
          description: 'We have responded to your inquiry',
        };
      case 'closed':
        return {
          color: 'text-gray-800',
          bg: 'bg-gray-100',
          border: 'border-gray-500',
          icon: <XCircle className="w-6 h-6 text-gray-600" />,
          label: 'Closed',
          description: 'This inquiry has been closed',
        };
      default:
        return {
          color: 'text-gray-800',
          bg: 'bg-gray-100',
          border: 'border-gray-500',
          icon: <Clock className="w-6 h-6 text-gray-600" />,
          label: status,
          description: '',
        };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-500';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-500';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  return (
    <div className="relative bg-zinc-50 min-h-screen">
      <Navbar />

      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400 mb-4">
              Track Your Inquiry
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your reference ID to check the status of your contact message
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reference ID
                </label>
                <input
                  type="text"
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter your reference ID"
                  className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="sm:self-end">
                <button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-lime-500 text-white font-semibold rounded-lg hover:from-green-700 hover:to-lime-600 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {loading ? 'Searching...' : 'Track Inquiry'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Contact Details */}
          {contact && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className={`bg-white rounded-2xl shadow-lg p-8 border-l-4 ${getStatusConfig(contact.status).border}`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${getStatusConfig(contact.status).bg}`}>
                      {getStatusConfig(contact.status).icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Status: {getStatusConfig(contact.status).label}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {getStatusConfig(contact.status).description}
                      </p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold uppercase ${getPriorityColor(contact.priority)}`}>
                    {contact.priority} Priority
                  </span>
                </div>

                {/* Reference ID */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Reference ID</p>
                  <code className="text-lg font-bold text-gray-900 font-mono">
                    #{contact.id.slice(-8).toUpperCase()}
                  </code>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-semibold text-gray-900">{contact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Topic</p>
                    <p className="font-semibold text-gray-900 capitalize">{contact.topic}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Submitted</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(contact.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(contact.updated_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* Your Message */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Message</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{contact.message}</p>
                </div>

                {/* Response */}
                {contact.response && (
                  <div className="bg-gradient-to-r from-green-50 to-lime-50 border-2 border-green-500 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-900">Our Response</h3>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap mb-3">{contact.response}</p>
                    {contact.responded_at && (
                      <p className="text-sm text-green-700">
                        Responded on {new Date(contact.responded_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Need More Help */}
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Need Additional Help?
                </h3>
                <p className="text-gray-600 mb-6">
                  If you have follow-up questions or need further assistance, feel free to contact us again.
                </p>
                <a
                  href="/contact"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-lime-500 text-white font-semibold rounded-lg hover:from-green-700 hover:to-lime-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Submit New Inquiry
                </a>
              </div>
            </div>
          )}

          {/* No Results Yet */}
          {!contact && !error && !loading && contactId && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Enter Your Reference ID
              </h3>
              <p className="text-gray-600">
                Type your reference ID in the search box above to track your inquiry
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TrackContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <TrackContactContent />
    </Suspense>
  );
}
