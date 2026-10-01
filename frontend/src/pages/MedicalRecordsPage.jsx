import React, { useEffect, useState } from 'react';
import { medicalRecordService, patientService, doctorService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus } from 'lucide-react';

export const MedicalRecordsPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '', doctorId: '', symptoms: '', diagnosis: '', treatment: '', notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await medicalRecordService.getAll();
      setRecords(res.data);
      setFilteredRecords(res.data);

      if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
        const [pts, docs] = await Promise.all([
          patientService.getAll().catch(() => ({ data: [] })),
          doctorService.getAll().catch(() => ({ data: [] }))
        ]);
        setPatients(pts.data);
        setDoctors(docs.data);
        if (user.role === 'DOCTOR' && user.doctorId) {
          setFormData(prev => ({ ...prev, doctorId: user.doctorId }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredRecords(records);
    else {
      const q = search.toLowerCase();
      setFilteredRecords(records.filter(r =>
        r.patient?.user?.fullName?.toLowerCase().includes(q) ||
        r.diagnosis?.toLowerCase().includes(q) ||
        r.symptoms?.toLowerCase().includes(q)
      ));
    }
  }, [search, records]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        patientId: parseInt(formData.patientId),
        doctorId: user.role === 'DOCTOR' ? user.doctorId : parseInt(formData.doctorId)
      };
      await medicalRecordService.create(payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create medical record');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Date', render: r => r.recordDate ? new Date(r.recordDate).toLocaleDateString() : 'N/A' },
    { header: 'Patient', render: r => r.patient?.user?.fullName || 'N/A' },
    { header: 'Doctor', render: r => r.doctor?.user?.fullName || 'N/A' },
    { header: 'Diagnosis', render: r => <strong style={{ color: '#60a5fa' }}>{r.diagnosis}</strong> },
    { header: 'Symptoms', accessor: 'symptoms' },
    { header: 'Treatment Plan', accessor: 'treatment' }
  ];

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Medical Records</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Patient Diagnoses, Clinical Findings & Treatment History</p>
        </div>
        {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Record Diagnosis
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search records by patient, diagnosis or symptoms..." />
        </div>
        <DataTable columns={columns} data={filteredRecords} loading={loading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Patient Diagnosis">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Patient *</label>
            <select required value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })}>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.user?.fullName}</option>)}
            </select>
          </div>

          {user.role === 'ADMIN' && (
            <div className="form-group">
              <label>Select Doctor *</label>
              <select required value={formData.doctorId} onChange={e => setFormData({ ...formData, doctorId: e.target.value })}>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.fullName}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Symptoms *</label>
            <textarea required value={formData.symptoms} onChange={e => setFormData({ ...formData, symptoms: e.target.value })} rows={2} placeholder="Observed symptoms..." />
          </div>

          <div className="form-group">
            <label>Diagnosis *</label>
            <textarea required value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} rows={2} placeholder="Clinical diagnosis..." />
          </div>

          <div className="form-group">
            <label>Treatment Plan</label>
            <textarea value={formData.treatment} onChange={e => setFormData({ ...formData, treatment: e.target.value })} rows={2} placeholder="Treatment recommendation..." />
          </div>

          <div className="form-group">
            <label>Clinical Notes</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Additional observations..." />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Save Medical Record</button>
        </form>
      </Modal>
    </div>
  );
};
