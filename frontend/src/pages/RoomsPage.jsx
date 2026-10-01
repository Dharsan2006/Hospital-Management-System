import React, { useEffect, useState } from 'react';
import { roomService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { BedDouble, Plus, Edit } from 'lucide-react';

export const RoomsPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '', roomType: 'GENERAL', dailyRate: 50.0, status: 'AVAILABLE'
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await roomService.getAll();
      setRooms(res.data);
      setFilteredRooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredRooms(rooms);
    else {
      const q = search.toLowerCase();
      setFilteredRooms(rooms.filter(r =>
        r.roomNumber.toLowerCase().includes(q) ||
        r.roomType.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      ));
    }
  }, [search, rooms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await roomService.create(formData);
      setIsModalOpen(false);
      setFormData({ roomNumber: '', roomType: 'GENERAL', dailyRate: 50.0, status: 'AVAILABLE' });
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add room');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Room Number', render: r => <strong>Room {r.roomNumber}</strong> },
    { header: 'Type', render: r => <span className="badge badge-info">{r.roomType}</span> },
    { header: 'Daily Rate', render: r => `$${r.dailyRate?.toFixed(2)} / day` },
    { 
      header: 'Status', 
      render: r => (
        <span className={`badge ${
          r.status === 'AVAILABLE' ? 'badge-success' :
          r.status === 'OCCUPIED' ? 'badge-danger' : 'badge-warning'
        }`}>
          {r.status}
        </span>
      ) 
    }
  ];

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Rooms & Ward Capacity</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Inpatient Accommodations & Bed Statuses</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Room
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search rooms by number, type or status..." />
        </div>
        <DataTable columns={columns} data={filteredRooms} loading={loading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Hospital Room">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Room Number *</label>
            <input type="text" required value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} placeholder="e.g. 104" />
          </div>
          <div className="form-group">
            <label>Room Type</label>
            <select value={formData.roomType} onChange={e => setFormData({ ...formData, roomType: e.target.value })}>
              <option value="GENERAL">GENERAL</option>
              <option value="SEMI_PRIVATE">SEMI_PRIVATE</option>
              <option value="PRIVATE">PRIVATE</option>
              <option value="ICU">ICU</option>
            </select>
          </div>
          <div className="form-group">
            <label>Daily Rate ($) *</label>
            <input type="number" step="0.01" required value={formData.dailyRate} onChange={e => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Initial Status</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Create Room</button>
        </form>
      </Modal>
    </div>
  );
};
