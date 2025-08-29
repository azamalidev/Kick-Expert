import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiMail, FiUser, FiCheckCircle, FiEye, FiX, FiSend, FiSearch, FiFilter } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────
type Ticket = {
  id: number;
  user_id: string;
  topic: string;
  issue_description: string;
  status: 'open' | 'in-progress' | 'closed';
  created_at: string;
};

type Message = {
  id: number;
  ticket_id: number;
  sender: string | null; // 'user' | 'admin' | null
  message: string;
  created_at: string;
};

// Topic options
const TOPIC_OPTIONS = [
  'Billing Issue',
  'Technical Problem',
  'Feature Request',
  'Account Issue',
  'General Inquiry',
  'Bug Report',
  'Other'
];

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────
const Support = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in-progress' | 'closed'>('all');
  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────────
  // Fetch tickets
  // ──────────────────────────────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ticket fetch error:', error);
        toast.error(`Failed to load tickets: ${error.message}`);
        return;
      }
      setTickets((data || []) as Ticket[]);
    } catch (err) {
      console.error('Ticket fetch exception:', err);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ──────────────────────────────────────────────────────────────────────────────
  // Fetch messages for a ticket
  // ──────────────────────────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (ticketId: number) => {
    try {
      setMsgLoading(true);
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Message fetch error:', error);
        toast.error(`Failed to load messages: ${error.message}`);
        return;
      }
      setMessages((data || []) as Message[]);
    } catch (err) {
      console.error('Message fetch exception:', err);
      toast.error('Failed to load messages');
    } finally {
      setMsgLoading(false);
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────────────
  // Filtering
  // ──────────────────────────────────────────────────────────────────────────────
  const filteredTickets = tickets.filter((ticket) => {
    // Status filter
    let statusMatch = true;
    if (activeTab === 'open') statusMatch = ticket.status === 'open';
    if (activeTab === 'in-progress') statusMatch = ticket.status === 'in-progress';
    if (activeTab === 'closed') statusMatch = ticket.status === 'closed';
    
    // Topic filter
    const topicMatch = topicFilter === 'all' || ticket.topic === topicFilter;
    
    // Search term filter
    const searchMatch = 
      searchTerm === '' || 
      ticket.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.issue_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && topicMatch && searchMatch;
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Modal handlers
  // ──────────────────────────────────────────────────────────────────────────────
  const openTicketModal = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    setIsModalOpen(true);
    await fetchMessages(ticket.id);
  };

  const closeTicketModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    setMessages([]);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // Reply submit (admin) → SAVE to DB
  // ──────────────────────────────────────────────────────────────────────────────
  const handleReplySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedTicket) {
      toast.error('Reply cannot be empty');
      return;
    }

    try {
      const { error } = await supabase.from('support_messages').insert([
        {
          ticket_id: selectedTicket.id,
          sender: 'admin', // ✅ clearly mark admin
          message: replyText.trim(),
        },
      ]);

      if (error) {
        console.error('Reply insert error:', error);
        toast.error(`Failed to send reply: ${error.message}`);
        return;
      }

      toast.success('Reply sent');
      setReplyText('');
      await fetchMessages(selectedTicket.id); // refresh conversation
    } catch (err) {
      console.error('Reply insert exception:', err);
      toast.error('Failed to send reply');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // Update ticket status
  // ──────────────────────────────────────────────────────────────────────────────
  const handleUpdateTicketStatus = async (id: number, status: 'open' | 'in-progress' | 'closed') => {
    try {
      const { error } = await supabase.from('support').update({ status }).eq('id', id);

      if (error) {
        console.error('Ticket status update error:', error);
        toast.error(`Failed to update ticket: ${error.message}`);
        return;
      }

      toast.success(`Ticket ${status === 'closed' ? 'closed' : 'updated'}`);
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      if (selectedTicket?.id === id) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (err) {
      console.error('Ticket status update exception:', err);
      toast.error('Failed to update ticket');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // Utils
  // ──────────────────────────────────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <h1 className="text-3xl font-bold text-gray-800">Support Center</h1>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              {/* Search Input */}
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search tickets by topic, description, or user ID..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiFilter className="mr-2" />
                Filters
              </button>
            </div>
            
            {/* Additional Filters (shown when toggled) */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Topic Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                  >
                    <option value="all">All Topics</option>
                    {TOPIC_OPTIONS.map((topic) => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>
                
                {/* Status Filter (alternative to tabs) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as any)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b">
              <button
                className={`px-6 py-3 font-medium ${
                  activeTab === 'all'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All Tickets
              </button>
              <button
                className={`px-6 py-3 font-medium ${
                  activeTab === 'open'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('open')}
              >
                Open
              </button>
              <button
                className={`px-6 py-3 font-medium ${
                  activeTab === 'in-progress'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('in-progress')}
              >
                In Progress
              </button>
              <button
                className={`px-6 py-3 font-medium ${
                  activeTab === 'closed'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('closed')}
              >
                Closed
              </button>
            </div>

            {/* Tickets Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <p className="p-6 text-gray-500">Loading tickets...</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Topic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTickets.length > 0 ? (
                      filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <FiMail className="mr-2 text-gray-400" />
                              {ticket.user_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.topic}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(ticket.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
                            >
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => openTicketModal(ticket)}
                              className="flex items-center text-indigo-600 hover:text-indigo-800"
                            >
                              <FiEye className="mr-1" /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No tickets found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Ticket Details</h2>
                <p className="text-sm text-indigo-600 mt-1">
                  {selectedTicket.status === 'open' ? (
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2 animate-pulse"></span>
                      Open Ticket
                    </span>
                  ) : selectedTicket.status === 'in-progress' ? (
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                      In Progress
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Resolved
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={closeTicketModal}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <FiX className="text-xl text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="space-y-6">
                {/* Ticket Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      From (User ID)
                    </h3>
                    <p className="mt-1 text-sm font-medium text-gray-900 flex items-center">
                      <FiMail className="mr-2 text-indigo-500" />
                      {selectedTicket.user_id}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</h3>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {new Date(selectedTicket.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Topic</h3>
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-sm font-medium text-indigo-800">{selectedTicket.topic}</p>
                  </div>
                </div>

                {/* Issue Description */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Issue Description</h3>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-800 whitespace-pre-line">{selectedTicket.issue_description}</p>
                  </div>
                </div>

                {/* Messages / Conversation */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Conversation</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {msgLoading ? (
                      <p className="text-gray-500 text-sm">Loading messages...</p>
                    ) : messages.length > 0 ? (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg max-w-[80%] ${
                            msg.sender === 'user'
                              ? 'bg-white border self-start'
                              : 'bg-indigo-600 text-white self-end ml-auto'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{msg.message}</p>
                          <span className="block text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No messages yet.</p>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleReplySubmit}>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Your Response
                    </h3>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                      rows={5}
                      placeholder="Type your detailed response here..."
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Press Shift+Enter for new line</p>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100 bg-gray-50 space-y-3 sm:space-y-0">
              <div className="flex space-x-2 w-full sm:w-auto">
                {selectedTicket.status !== 'closed' && (
                  <>
                    <button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'in-progress')}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                    >
                      Mark as In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'closed')}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors flex items-center"
                    >
                      <FiCheckCircle className="mr-2" />
                      Close Ticket
                    </button>
                  </>
                )}
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
                  onClick={() => {
                    /* Assign ticket logic (optional) */
                  }}
                >
                  <FiUser className="mr-2" />
                  Assign
                </button>
              </div>
              <button
                onClick={handleReplySubmit}
                className="w-full sm:w-auto flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-indigo-200"
              >
                <FiSend className="mr-2" />
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;