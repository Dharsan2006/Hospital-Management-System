import React, { useEffect, useState } from 'react';
import { appointmentService, patientService, doctorService, departmentService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Check, X, ShieldAlert } from 'lucide-react';

export const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppts, setFilteredAppts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    patientId: '', doctorId: '', departmentId: '', appointmentDate: '', appointmentTime: '10:00', reason: '', notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const apptsRes = await appointmentService.getAll();
      setAppointments(apptsRes.data);
      setFilteredAppts(apptsRes.data);

      if (user.role !== 'PATIENT') {
        const [pts, docs, depts] = await Promise.all([
          patientService.getAll().catch(() => ({ data: [] })),
          doctorService.getAll().catch(() => ({ data: [] })),
          departmentService.getAll().catch(() => ({ data: [] }))
        ]);
        setPatients(pts.data);
        setDoctors(docs.data);
        setDepartments(depts.data);
      } else {
        const [docs, depts] = await Promise.all([
          doctorService.getAll().catch(() => ({ data: [] })),
          departmentService.getAll().catch(() => ({ data: [] }))
        ]);
        setDoctors(docs.data);
        setDepartments(depts.data);
        if (user.patientId) {
          setFormData(prev => ({ ...prev, patientId: user.patientId }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredAppts(appointments);
    else {
      const q = search.toLowerCase();
      setFilteredAppts(appointments.filter(a =>
        a.patient?.user?.fullName?.toLowerCase().includes(q) ||
        a.doctor?.user?.fullName?.toLowerCase().includes(q) ||
        a.status?.toLowerCase().includes(q)
      ));
    }
  }, [search, appointments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...formData,
        patientId: user.role === 'PATIENT' ? user.patientId : parseInt(formData.patientId),
        doctorId: parseInt(formData.doctorId),
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        appointmentTime: formData.appointmentTime.length === 5 ? `${formData.appointmentTime}:00` : formData.appointmentTime
      };

      await appointmentService.book(payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment. Please check schedule availability.');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCancel = async (id) => {
    try {
      await appointmentService.cancel(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Date & Time', render: r => `${r.appointmentDate} at ${r.appointmentTime}` },
    { header: 'Patient', render: r => r.patient?.user?.fullName || 'N/A' },
    { header: 'Doctor', render: r => r.doctor?.user?.fullName || 'N/A' },
    { header: 'Department', render: r => r.department?.name || 'General' },
    { header: 'Reason', accessor: 'reason' },
    { 
      header: 'Status', 
      render: r => (
        <span className={`badge ${
          r.status === 'CONFIRMED' ? 'badge-success' :
          r.status === 'COMPLETED' ? 'badge-info' :
          r.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
        }`}>
          {r.status}
        </span>
      ) 
    },
    {
      header: 'Actions',
      render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          {r.status === 'PENDING' && (user.role === 'DOCTOR' || user.role === 'RECEPTIONIST' || user.role === 'ADMIN') && (
            <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(r.id, 'CONFIRMED')}>
              <Check size={14} /> Confirm
            </button>
          )}
          {r.status === 'CONFIRMED' && (user.role === 'DOCTOR' || user.role === 'ADMIN') && (
            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(r.id, 'COMPLETED')}>
              Complete
            </button>
          )}
          {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r.id)}>
              <X size={14} /> Cancel
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Appointment Booking</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Schedule & Manage Doctor Consultations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search appointments by patient, doctor or status..." />
        </div>
        <DataTable columns={columns} data={filteredAppts} loading={loading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Book Doctor Appointment">
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(244, 63, 94, 0.15)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem', marginBottom: 16 }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {user.role !== 'PATIENT' && (
            <div className="form-group">
              <label>Select Patient *</label>
              <select required value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })}>
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.user?.fullName} ({p.user?.email})</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Select Doctor *</label>
            <select required value={formData.doctorId} onChange={e => setFormData({ ...formData, doctorId: e.target.value })}>
              <option value="">Select Doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.fullName} - {d.specialization} (${d.consultationFee})</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Appointment Date *</label>
              <input type="date" required value={formData.appointmentDate} onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Time Slot *</label>
              <input type="time" required value={formData.appointmentTime} onChange={e => setFormData({ ...formData, appointmentTime: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Reason for Visit</label>
            <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} rows={2} placeholder="Describe symptoms or purpose..." />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Confirm Appointment Booking</button>
        </form>
      </Modal>
    </div>
  );
};
