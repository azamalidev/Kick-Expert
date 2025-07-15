import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiMail, FiUser, FiCheckCircle, FiEye, FiX, FiSend } from 'react-icons/fi';

type Ticket = {
  id: number;
  user: string;
  subject: string;
  date: string;
  status: 'Open' | 'Closed';
  message: string;
};

const Support = () => {
  // Sample ticket data
  const initialTickets: Ticket[] = [
    {
      id: 1,
      user: 'player1@example.com',
      subject: 'Withdrawal issue',
      date: '2025-06-08',
      status: 'Open',
      message: 'My withdrawal of $50 has been pending for 3 days. Can you check?'
    },
    {
      id: 2,
      user: 'fanatic@example.com',
      subject: 'Incorrect question in Pro league',
      date: '2025-06-07',
      status: 'Open',
      message: 'Question #42 in the Pro league quiz has an incorrect answer marked as correct.'
    },
    {
      id: 3,
      user: 'newbie@example.com',
      subject: 'How do I use entry credits?',
      date: '2025-06-06',
      status: 'Closed',
      message: "I can't figure out how to apply my entry credits to join a competition."
    },
  ];

  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed'>('all');

  // Filter tickets based on active tab
  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'open') return ticket.status === 'Open';
    if (activeTab === 'closed') return ticket.status === 'Closed';
    return true;
  });

  // Open ticket modal
  const openTicketModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    setIsModalOpen(true);
  };

  // Close ticket modal
  const closeTicketModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  // Handle reply submission
  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this reply to your backend
    toast.success(`Reply sent to ${selectedTicket?.user}`);
    setReplyText('');
  };

  // Close a ticket
  const handleCloseTicket = (id: number) => {
    setTickets(tickets.map(ticket => 
      ticket.id === id ? { ...ticket, status: 'Closed' } : ticket
    ));
    if (selectedTicket?.id === id) {
      setSelectedTicket({ ...selectedTicket, status: 'Closed' });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <h1 className="text-3xl font-bold text-gray-800">Support Center</h1>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b">
              <button
                className={`px-6 py-3 font-medium ${activeTab === 'all' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('all')}
              >
                All Tickets
              </button>
              <button
                className={`px-6 py-3 font-medium ${activeTab === 'open' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('open')}
              >
                Open
              </button>
              <button
                className={`px-6 py-3 font-medium ${activeTab === 'closed' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('closed')}
              >
                Closed
              </button>
            </div>

            {/* Tickets Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map(ticket => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <FiMail className="mr-2 text-gray-400" />
                            {ticket.user}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(ticket.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.status === 'Open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
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
          {selectedTicket.status === 'Open' ? (
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2 animate-pulse"></span>
              Open Ticket
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">From</h3>
            <p className="mt-1 text-sm font-medium text-gray-900 flex items-center">
              <FiMail className="mr-2 text-indigo-500" />
              {selectedTicket.user}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {new Date(selectedTicket.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Subject */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Subject</h3>
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-sm font-medium text-indigo-800">{selectedTicket.subject}</p>
          </div>
        </div>

        {/* Message */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">User's Message</h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-line">{selectedTicket.message}</p>
          </div>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleReplySubmit}>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Your Response</h3>
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
        <button
          onClick={() => selectedTicket.status === 'Open' && handleCloseTicket(selectedTicket.id)}
          disabled={selectedTicket.status === 'Closed'}
          className={`px-4 py-2 rounded-lg flex items-center transition-all ${
            selectedTicket.status === 'Open'
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <FiCheckCircle className="mr-2" />
          Close Ticket
        </button>
        <button 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
          onClick={() => {
            /* Assign ticket logic */
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