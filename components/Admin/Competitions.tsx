'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PlusCircle } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Competition {
  id: string;
  league: string;
  entry_fee: string;
  players: number;
  status: 'Running' | 'Finished' | 'Scheduled';
  start_date: string;
  end_date: string;
}

export default function Competitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompetition, setNewCompetition] = useState<Omit<Competition, 'id' | 'status'>>({
    league: 'Starter',
    entry_fee: '',
    players: 0,
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(true);

  // Fetch competitions from Supabase
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (error) throw error;
        setCompetitions(data);
      } catch (error) {
        console.error('Error fetching competitions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

  const handleCreateCompetition = async () => {
    try {
      const { error } = await supabase
        .from('competitions')
        .insert([{ 
          ...newCompetition, 
          status: 'Scheduled',
          start_date: new Date(newCompetition.start_date),
          end_date: new Date(newCompetition.end_date)
        }]);

      if (error) throw error;

      // Refresh competitions list
      const { data } = await supabase
        .from('competitions')
        .select('*')
        .order('start_date', { ascending: true });
      
      setCompetitions(data!);
      setNewCompetition({ league: 'Starter', entry_fee: '', players: 0, start_date: '', end_date: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating competition:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running': return 'bg-lime-100 text-lime-800';
      case 'Finished': return 'bg-gray-100 text-gray-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Competitions Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle size={18} />
          Create Competition
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading competitions...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">League</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Players</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {competitions.map((comp) => (
                <tr key={comp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comp.league}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(comp.start_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(comp.end_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Fee</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.players}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(comp.status)}`}>
                      {comp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Competition Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-lg">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Create New Competition</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">League</label>
                <select
                  value={newCompetition.league}
                  onChange={(e) => setNewCompetition({...newCompetition, league: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                >
                  <option value="Starter">Starter</option>
                  <option value="Pro">Pro</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={newCompetition.start_date}
                  onChange={(e) => setNewCompetition({...newCompetition, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  value={newCompetition.end_date}
                  onChange={(e) => setNewCompetition({...newCompetition, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee</label>
                <input
                  type="text"
                  value={newCompetition.entry_fee}
                  onChange={(e) => setNewCompetition({...newCompetition, entry_fee: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                  placeholder="e.g. $10"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCompetition}
                className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}