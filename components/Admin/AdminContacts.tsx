'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Mail, MessageSquare, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

// Create admin client with service role for proper permissions
const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

interface Contact {
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

export default function AdminContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage] = useState(20);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      // Use API route to fetch contacts with proper permissions
      const response = await fetch('/api/admin/contacts/list');
      const result = await response.json();
      
      if (result.success) {
        setContacts(result.contacts || []);
      } else {
        throw new Error(result.error || 'Failed to load contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (contactId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/contacts/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, status: newStatus }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setContacts(
        contacts.map((c) =>
          c.id === contactId ? { ...c, status: newStatus as any } : c
        )
      );
      if (selectedContact?.id === contactId) {
        setSelectedContact({ ...selectedContact, status: newStatus as any });
      }
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const updateContactPriority = async (contactId: string, newPriority: string) => {
    try {
      const response = await fetch('/api/admin/contacts/update-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, priority: newPriority }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setContacts(
        contacts.map((c) =>
          c.id === contactId ? { ...c, priority: newPriority as any } : c
        )
      );
      if (selectedContact?.id === contactId) {
        setSelectedContact({ ...selectedContact, priority: newPriority as any });
      }
      toast.success('Priority updated');
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const sendResponse = async (contactId: string) => {
    if (!responseText.trim()) {
      toast.error('Response cannot be empty');
      return;
    }

    const contactToUpdate = contacts.find(c => c.id === contactId);
    if (!contactToUpdate) {
      toast.error('Contact not found');
      return;
    }

    try {
      // Update contact with response via API (do NOT auto-resolve)
      const updateResponse = await fetch('/api/admin/contacts/send-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactId, 
          response: responseText 
        }),
      });

      const updateResult = await updateResponse.json();
      if (!updateResult.success) throw new Error(updateResult.error);

      // Send email notification to user
      try {
        await fetch('/api/email/contact-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: contactToUpdate.email,
            name: contactToUpdate.name,
            topic: contactToUpdate.topic,
            contactId: contactToUpdate.id,
            response: responseText,
            adminName: 'KickExpert Support',
          }),
        });
        console.log('✅ Response email sent to:', contactToUpdate.email);
      } catch (emailError) {
        console.error('⚠️ Failed to send response email:', emailError);
        // Don't fail if email fails
      }

      setContacts(
        contacts.map((c) =>
          c.id === contactId
            ? {
                ...c,
                response: responseText,
                responded_at: new Date().toISOString(),
              }
            : c
        )
      );
      if (selectedContact?.id === contactId) {
        setSelectedContact({
          ...selectedContact,
          response: responseText,
          responded_at: new Date().toISOString(),
        });
      }
      setResponseText('');
      setRespondingTo(null);
      toast.success('Response sent successfully! User will receive an email.');
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || contact.priority === filterPriority;
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Pagination calculations
  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstContact, indexOfLastContact);
  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPriority, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
        <p className="text-gray-600 mt-1">Manage and respond to user contact messages</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
            </div>
            <MessageSquare size={32} className="text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">New Messages</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.filter((c) => c.status === 'new').length}</p>
            </div>
            <AlertCircle size={32} className="text-yellow-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.filter((c) => c.status === 'resolved').length}</p>
            </div>
            <CheckCircle size={32} className="text-green-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 p-6 rounded-xl">
        {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <button
          onClick={fetchContacts}
          className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading contacts...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contacts List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedContact?.id === contact.id ? 'bg-lime-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {contact.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{contact.topic}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(contact.status)}`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(contact.priority)}`}>
                          {contact.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="p-6 border-t flex justify-center items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium transition ${
                            currentPage === page
                              ? 'bg-lime-600 text-white border-lime-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 py-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Contact Details */}
          {selectedContact && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedContact.name}</h3>
                  <p className="text-sm text-gray-600">{selectedContact.email}</p>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Status</label>
                    <select
                      value={selectedContact.status}
                      onChange={(e) => updateContactStatus(selectedContact.id, e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                    >
                      <option value="new">New</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-600">Priority</label>
                    <span className="text-xs text-gray-500 italic">Auto-assigned</span>
                  </div>
                  <select
                    value={selectedContact.priority}
                    onChange={(e) => updateContactPriority(selectedContact.id, e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 High priority for payouts/support topics
                  </p>
                </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Message</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedContact.message}</p>
                </div>

                {selectedContact.response ? (
                  <div className="border-t pt-4 bg-green-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Response Sent ✅</h4>
                    <p className="text-sm text-green-800">{selectedContact.response}</p>
                    <p className="text-xs text-green-600 mt-2">
                      Sent: {new Date(selectedContact.responded_at!).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                      📧 Email notification was sent to the user
                    </p>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Send Response</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      📧 User will receive an email notification when you send a response
                    </p>
                    <textarea
                      value={respondingTo === selectedContact.id ? responseText : ''}
                      onChange={(e) => setResponseText(e.target.value)}
                      onFocus={() => setRespondingTo(selectedContact.id)}
                      placeholder="Type your response here..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm resize-none"
                    />
                    <button
                      onClick={() => sendResponse(selectedContact.id)}
                      className="mt-2 w-full px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg transition-colors font-semibold"
                    >
                      Send Response (Email User)
                    </button>
               
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
