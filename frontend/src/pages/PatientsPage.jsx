import React, { useEffect, useState } from 'react';
import { patientService, authService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { UserCheck, Plus, Edit } from 'lucide-react';

export const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: 'Admin@123', phone: '', dob: '', gender: 'Male', bloodGroup: 'O+', address: '', emergencyContact: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await patientService.getAll();
      setPatients(res.data);
      setFilteredPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredPatients(patients);
    else {
      const q = search.toLowerCase();
      setFilteredPatients(patients.filter(p =>
        p.user?.fullName?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.bloodGroup?.toLowerCase().includes(q)
      ));
    }
  }, [search, patients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.register({ ...formData, role: 'PATIENT' });
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register patient');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Patient Name', render: r => r.user?.fullName || 'N/A' },
    { header: 'Email', render: r => r.user?.email || 'N/A' },
    { header: 'Phone', render: r => r.user?.phone || 'N/A' },
    { header: 'Gender', accessor: 'gender' },
    { header: 'Blood Group', render: r => <span className="badge badge-info">{r.bloodGroup || 'N/A'}</span> },
    { header: 'DOB', accessor: 'dob' },
    { header: 'Emergency Contact', accessor: 'emergencyContact' }
  ];

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Patient Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Registered Patients & Medical Profiles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Register New Patient
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search patients by name, email, blood group..." />
        </div>
        <DataTable columns={columns} data={filteredPatients} loading={loading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Patient">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Gender</label>
              <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Blood Group</label>
              <select value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}>
                <option value="O+">O+</option><option value="A+">A+</option><option value="B+">B+</option><option value="AB+">AB+</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Emergency Contact</label>
            <input type="text" value={formData.emergencyContact} onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Register Patient</button>
        </form>
      </Modal>
    </div>
  );
};
