import React, { useEffect, useState } from 'react';
import { userService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Trash2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getAll();
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) {
      setFilteredUsers(users);
    } else {
      const q = search.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.fullName.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.role.toLowerCase().includes(q)
      ));
    }
  }, [search, users]);

  const handleDelete = async () => {
    if (!selectedUserId) return;
    try {
      await userService.delete(selectedUserId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Full Name', accessor: 'fullName' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone', render: r => r.phone || 'N/A' },
    { 
      header: 'Role', 
      render: r => <span className={`badge badge-${r.role.toLowerCase()}`}>{r.role}</span> 
    },
    { 
      header: 'Status', 
      render: r => (
        <span className={`badge ${r.active ? 'badge-success' : 'badge-danger'}`}>
          {r.active ? 'Active' : 'Inactive'}
        </span>
      ) 
    },
    {
      header: 'Actions',
      render: r => (
        <button
          className="btn btn-danger btn-sm"
          disabled={!r.active}
          onClick={() => { setSelectedUserId(r.id); setIsDeleteOpen(true); }}
        >
          <Trash2 size={14} /> Deactivate
        </button>
      )
    }
  ];

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>System User Accounts & Security Roles</p>
        </div>
        <Link to="/register" className="btn btn-primary">
          <UserPlus size={16} /> Register New Account
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search users by name, email, or role..." />
        </div>

        <DataTable columns={columns} data={filteredUsers} loading={loading} />
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Deactivate User Account"
        message="Are you sure you want to deactivate this user account?"
      />
    </div>
  );
};
