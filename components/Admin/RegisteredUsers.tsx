'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Search, Loader2 } from 'lucide-react';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
};

export default function RegisteredUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

useEffect(() => {
  const fetchUsers = async () => {
    try {
      // Get logged-in user session
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        toast.error("Please log in to access this page");
        router.push('/login');
        return;
      }

      // Get the current user from your users table
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', authUser.id)
        .single();

      if (currentUserError || !currentUser) {
        toast.error("Failed to fetch current user data");
        router.push('/login');
        return;
      }

      if (currentUser.role !== 'admin') {
        toast.error("Access denied. Admins only.");
        router.push('/');
        return;
      }

      // Fetch all users (RLS allows this only for admins)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  fetchUsers();
}, [router]);


  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const searchLower = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower)
    );

    setFilteredUsers(filtered);
  }, [searchQuery, users]);

 
const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editUser) return;

  setIsProcessing(true);
  const toastId = toast.loading("Updating user...");
  
  try {
    const { error } = await supabase
      .from('users')
      .update({
        name: editUser.name,
        role: editUser.role,
        email: editUser.email, // if you store email in your users table
      })
      .eq('id', editUser.id);

    if (error) throw error;

    setUsers(users.map(u => u.id === editUser.id ? editUser : u));
    toast.success("User updated successfully", { id: toastId });
    setEditUser(null);
  } catch (error: any) {
    console.error("Error updating user:", error);
    toast.error(error.message || "Failed to update user", { id: toastId });
  } finally {
    setIsProcessing(false);
  }
};



const handleDelete = async (id: string) => {
  setIsProcessing(true);
  const toastId = toast.loading("Deleting user...");

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setUsers(users.filter(u => u.id !== id));
    toast.success("User deleted successfully", { id: toastId });
    setDeleteConfirm(null);
  } catch (error: any) {
    console.error("Error deleting user:", error);
    toast.error(error.message || "Failed to delete user", { id: toastId });
  } finally {
    setIsProcessing(false);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-lime-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#363636', color: '#fff' },
          success: { duration: 3000 },
          error: { duration: 4000 },
          loading: { duration: Infinity },
        }}
      />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6">
          Registered Users ({users.length})
        </h1>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {searchQuery ? "No matching users found" : "No users available"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditUser(user)}
                        className="text-lime-600 hover:text-lime-800 mr-4 disabled:opacity-50"
                        disabled={isProcessing}
                        title="Edit User"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        disabled={isProcessing}
                        title="Delete User"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit User Modal */}
        {editUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit User</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editUser.name}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 disabled:opacity-50 flex items-center"
                    disabled={isProcessing}
                  >
                    {isProcessing && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                  disabled={isProcessing}
                >
                  {isProcessing && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}