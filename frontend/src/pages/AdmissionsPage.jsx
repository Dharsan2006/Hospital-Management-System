import React, { useEffect, useState } from 'react';
import { admissionService, patientService, doctorService, roomService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { DoorOpen, Plus, LogOut, ShieldAlert } from 'lucide-react';

export const AdmissionsPage = () => {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState(null);
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    patientId: '', doctorId: '', roomId: '', reason: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await admissionService.getAll();
      setAdmissions(res.data);
      setFilteredAdmissions(res.data);

      if (user.role !== 'PATIENT') {
        const [pts, docs, rms] = await Promise.all([
          patientService.getAll().catch(() => ({ data: [] })),
          doctorService.getAll().catch(() => ({ data: [] })),
          roomService.getAvailable().catch(() => ({ data: [] }))
        ]);
        setPatients(pts.data);
        setDoctors(docs.data);
        setAvailableRooms(rms.data);

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
    if (!search) setFilteredAdmissions(admissions);
    else {
      const q = search.toLowerCase();
      setFilteredAdmissions(admissions.filter(a =>
        a.patient?.user?.fullName?.toLowerCase().includes(q) ||
        a.doctor?.user?.fullName?.toLowerCase().includes(q) ||
        a.room?.roomNumber?.toLowerCase().includes(q) ||
        a.status?.toLowerCase().includes(q)
      ));
    }
  }, [search, admissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        patientId: parseInt(formData.patientId),
        doctorId: user.role === 'DOCTOR' ? user.doctorId : parseInt(formData.doctorId),
        roomId: parseInt(formData.roomId),
        reason: formData.reason
      };
      await admissionService.admit(payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to admit patient');
    }
  };

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmissionId) return;
    try {
      await admissionService.discharge(selectedAdmissionId, { dischargeSummary });
      setIsDischargeModalOpen(false);
      setDischargeSummary('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to discharge patient');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Admission Date', render: r => r.admissionDate ? new Date(r.admissionDate).toLocaleString() : 'N/A' },
    { header: 'Patient', render: r => r.patient?.user?.fullName || 'N/A' },
    { header: 'Doctor', render: r => r.doctor?.user?.fullName || 'N/A' },
    { header: 'Assigned Room', render: r => <span className="badge badge-info">Room {r.room?.roomNumber} ({r.room?.roomType})</span> },
    { header: 'Reason', accessor: 'reason' },
    { 
      header: 'Status', 
      render: r => (
        <span className={`badge ${r.status === 'ADMITTED' ? 'badge-warning' : 'badge-success'}`}>
          {r.status}
        </span>
      ) 
    },
    {
      header: 'Actions',
      render: r => (
        <div>
          {r.status === 'ADMITTED' && (user.role === 'RECEPTIONIST' || user.role === 'NURSE' || user.role === 'DOCTOR' || user.role === 'ADMIN') && (
            <button className="btn btn-danger btn-sm" onClick={() => { setSelectedAdmissionId(r.id); setIsDischargeModalOpen(true); }}>
              <LogOut size={14} /> Assist Discharge
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Patient Inpatient Admissions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage Hospital Admissions, Room Allocation & Discharge Summaries</p>
        </div>
        {user?.role !== 'PATIENT' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Admit Patient
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search admissions by patient, room or status..." />
        </div>
        <DataTable columns={columns} data={filteredAdmissions} loading={loading} />
      </div>

      {/* Modal Admit Patient */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Admit Inpatient">
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(244, 63, 94, 0.15)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem', marginBottom: 16 }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Patient *</label>
            <select required value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })}>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.user?.fullName}</option>)}
            </select>
          </div>

          {user.role !== 'DOCTOR' && (
            <div className="form-group">
              <label>Select Attending Doctor *</label>
              <select required value={formData.doctorId} onChange={e => setFormData({ ...formData, doctorId: e.target.value })}>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.fullName}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Select Available Room *</label>
            <select required value={formData.roomId} onChange={e => setFormData({ ...formData, roomId: e.target.value })}>
              <option value="">Select Room</option>
              {availableRooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber} - {r.roomType} (${r.dailyRate}/day)</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Admission Reason</label>
            <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} rows={2} placeholder="Reason for patient admission..." />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Confirm Admission</button>
        </form>
      </Modal>

      {/* Modal Discharge Patient */}
      <Modal isOpen={isDischargeModalOpen} onClose={() => setIsDischargeModalOpen(false)} title="Process Discharge">
        <form onSubmit={handleDischargeSubmit}>
          <div className="form-group">
            <label>Discharge Summary & Instructions</label>
            <textarea value={dischargeSummary} onChange={e => setDischargeSummary(e.target.value)} rows={4} placeholder="Summary of recovery and home care guidance..." />
          </div>
          <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: 12 }}>Confirm Patient Discharge</button>
        </form>
      </Modal>
    </div>
  );
};
