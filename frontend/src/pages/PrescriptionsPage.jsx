import React, { useEffect, useState } from 'react';
import { prescriptionService, patientService, doctorService, medicineService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Pill, Plus, CheckCircle, ShieldAlert } from 'lucide-react';

export const PrescriptionsPage = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    patientId: '', doctorId: '', medicineId: '', dosage: '500mg', frequency: 'Twice daily', duration: '5 days', quantity: 10, instructions: 'Take after meals'
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await prescriptionService.getAll();
      setPrescriptions(res.data);
      setFilteredPrescriptions(res.data);

      const [pts, docs, meds] = await Promise.all([
        patientService.getAll().catch(() => ({ data: [] })),
        doctorService.getAll().catch(() => ({ data: [] })),
        medicineService.getAll().catch(() => ({ data: [] }))
      ]);
      setPatients(pts.data);
      setDoctors(docs.data);
      setMedicines(meds.data);

      if (user.role === 'DOCTOR' && user.doctorId) {
        setFormData(prev => ({ ...prev, doctorId: user.doctorId }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredPrescriptions(prescriptions);
    else {
      const q = search.toLowerCase();
      setFilteredPrescriptions(prescriptions.filter(p =>
        p.patient?.user?.fullName?.toLowerCase().includes(q) ||
        p.doctor?.user?.fullName?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q)
      ));
    }
  }, [search, prescriptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        patientId: parseInt(formData.patientId),
        doctorId: user.role === 'DOCTOR' ? user.doctorId : parseInt(formData.doctorId),
        medicines: [{
          medicineId: parseInt(formData.medicineId),
          dosage: formData.dosage,
          frequency: formData.frequency,
          duration: formData.duration,
          quantity: parseInt(formData.quantity),
          instructions: formData.instructions
        }]
      };

      await prescriptionService.create(payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue prescription');
    }
  };

  const handleDispense = async (id) => {
    try {
      await prescriptionService.dispense(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispense prescription');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Prescribed Date', render: r => r.prescribedDate ? new Date(r.prescribedDate).toLocaleDateString() : 'N/A' },
    { header: 'Patient', render: r => r.patient?.user?.fullName || 'N/A' },
    { header: 'Doctor', render: r => r.doctor?.user?.fullName || 'N/A' },
    { 
      header: 'Prescribed Items', 
      render: r => (
        <div>
          {r.medicines?.map((m, idx) => (
            <div key={idx} style={{ fontSize: '0.85rem' }}>
              • <strong>{m.medicine?.name}</strong> ({m.dosage}, {m.frequency}, Qty: {m.quantity})
            </div>
          ))}
        </div>
      ) 
    },
    { 
      header: 'Status', 
      render: r => (
        <span className={`badge ${r.status === 'DISPENSED' ? 'badge-success' : 'badge-warning'}`}>
          {r.status}
        </span>
      ) 
    },
    {
      header: 'Actions',
      render: r => (
        <div>
          {r.status === 'PENDING' && (user.role === 'PHARMACIST' || user.role === 'ADMIN') && (
            <button className="btn btn-success btn-sm" onClick={() => handleDispense(r.id)}>
              <CheckCircle size={14} /> Dispense Medicine
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Prescription Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Issue & Dispense Patient Drug Prescriptions</p>
        </div>
        {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Prescription
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search prescriptions by patient, doctor or status..." />
        </div>
        <DataTable columns={columns} data={filteredPrescriptions} loading={loading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Doctor Prescription">
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
            <label>Select Medicine *</label>
            <select required value={formData.medicineId} onChange={e => setFormData({ ...formData, medicineId: e.target.value })}>
              <option value="">Select Medicine</option>
              {medicines.map(m => <option key={m.id} value={m.id}>{m.name} (In Stock: {m.stockQuantity})</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Dosage</label>
              <input type="text" value={formData.dosage} onChange={e => setFormData({ ...formData, dosage: e.target.value })} placeholder="500mg" />
            </div>

            <div className="form-group">
              <label>Frequency</label>
              <input type="text" value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })} placeholder="Twice daily" />
            </div>

            <div className="form-group">
              <label>Duration</label>
              <input type="text" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="5 days" />
            </div>

            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" required min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Instructions</label>
            <input type="text" value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} placeholder="Take after meals" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Issue Prescription</button>
        </form>
      </Modal>
    </div>
  );
};
