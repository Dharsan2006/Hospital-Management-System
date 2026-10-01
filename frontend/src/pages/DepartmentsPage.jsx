import React, { useEffect, useState } from 'react';
import { departmentService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Building2 } from 'lucide-react';

export const DepartmentsPage = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [filteredDepts, setFilteredDepts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', headDoctorName: '', description: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentService.getAll();
      setDepartments(res.data);
      setFilteredDepts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredDepts(departments);
    else {
      const q = search.toLowerCase();
      setFilteredDepts(departments.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q) ||
        d.headDoctorName?.toLowerCase().includes(q)
      ));
    }
  }, [search, departments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await departmentService.create(formData);
      setIsModalOpen(false);
      setFormData({ name: '', code: '', headDoctorName: '', description: '' });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Code', render: r => <span className="badge badge-info">{r.code || 'GEN'}</span> },
    { header: 'Department Name', accessor: 'name' },
    { header: 'Head Doctor', render: r => r.headDoctorName || 'N/A' },
    { header: 'Description', accessor: 'description' }
  ];

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Hospital Departments</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Specialized Medical Units & Clinical Divisions</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Department
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search departments by name or code..." />
        </div>
        <DataTable columns={columns} data={filteredDepts} loading={loading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Department">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Department Name *</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Cardiology" />
          </div>
          <div className="form-group">
            <label>Department Code</label>
            <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. CARD" />
          </div>
          <div className="form-group">
            <label>Head Doctor Name</label>
            <input type="text" value={formData.headDoctorName} onChange={e => setFormData({ ...formData, headDoctorName: e.target.value })} placeholder="e.g. Dr. Sarah Jenkins" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Department overview..." />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Create Department</button>
        </form>
      </Modal>
    </div>
  );
};
