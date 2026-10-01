import React, { useEffect, useState } from 'react';
import { doctorService, departmentService, authService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Stethoscope } from 'lucide-react';

export const DoctorsPage = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: 'Admin@123', phone: '', specialization: '', qualification: '', experienceYears: 5, consultationFee: 100.0, availableDays: 'Mon,Tue,Wed,Thu,Fri', departmentId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docs, depts] = await Promise.all([
        doctorService.getAll(),
        departmentService.getAll()
      ]);
      setDoctors(docs.data);
      setFilteredDoctors(docs.data);
      setDepartments(depts.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredDoctors(doctors);
    else {
      const q = search.toLowerCase();
      setFilteredDoctors(doctors.filter(d =>
        d.user?.fullName?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.department?.name?.toLowerCase().includes(q)
      ));
    }
  }, [search, doctors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.register({ ...formData, role: 'DOCTOR' });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add doctor');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Doctor Name', render: r => r.user?.fullName || 'N/A' },
    { header: 'Department', render: r => r.department?.name || 'Unassigned' },
    { header: 'Specialization', accessor: 'specialization' },
    { header: 'Qualification', accessor: 'qualification' },
    { header: 'Fee', render: r => `$${r.consultationFee?.toFixed(2)}` },
    { header: 'Available Days', accessor: 'availableDays' }
  ];

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Doctor Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Medical Specialists & Consultation Schedules</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Doctor
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search doctors by name, specialization, or department..." />
        </div>
        <DataTable columns={columns} data={filteredDoctors} loading={loading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Doctor">
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
            <label>Department</label>
            <select value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Specialization</label>
            <input type="text" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g. Cardiology & Heart Care" />
          </div>
          <div className="form-group">
            <label>Qualification</label>
            <input type="text" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} placeholder="e.g. MD, FACC" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Consultation Fee ($)</label>
              <input type="number" value={formData.consultationFee} onChange={e => setFormData({ ...formData, consultationFee: parseFloat(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Available Days</label>
              <input type="text" value={formData.availableDays} onChange={e => setFormData({ ...formData, availableDays: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Add Doctor</button>
        </form>
      </Modal>
    </div>
  );
};
