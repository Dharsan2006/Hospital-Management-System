import React, { useEffect, useState } from 'react';
import { billingService, patientService, admissionService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Receipt, Plus, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BillingPage = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '', admissionId: '', consultationFee: 100.0, medicineFee: 0.0, labFee: 0.0, roomFee: 0.0, otherCharges: 0.0, notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await billingService.getAll();
      setBills(res.data);
      setFilteredBills(res.data);

      if (user.role !== 'PATIENT') {
        const [pts, adms] = await Promise.all([
          patientService.getAll().catch(() => ({ data: [] })),
          admissionService.getAll().catch(() => ({ data: [] }))
        ]);
        setPatients(pts.data);
        setAdmissions(adms.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredBills(bills);
    else {
      const q = search.toLowerCase();
      setFilteredBills(bills.filter(b =>
        b.patient?.user?.fullName?.toLowerCase().includes(q) ||
        b.status?.toLowerCase().includes(q)
      ));
    }
  }, [search, bills]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patientId: parseInt(formData.patientId),
        admissionId: formData.admissionId ? parseInt(formData.admissionId) : null,
        consultationFee: parseFloat(formData.consultationFee),
        medicineFee: parseFloat(formData.medicineFee),
        labFee: parseFloat(formData.labFee),
        roomFee: parseFloat(formData.roomFee),
        otherCharges: parseFloat(formData.otherCharges),
        notes: formData.notes
      };
      await billingService.generate(payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate bill');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Bill Date', render: r => r.billDate ? new Date(r.billDate).toLocaleDateString() : 'N/A' },
    { header: 'Patient', render: r => r.patient?.user?.fullName || 'N/A' },
    { header: 'Consultation', render: r => `$${r.consultationFee?.toFixed(2)}` },
    { header: 'Medicine', render: r => `$${r.medicineFee?.toFixed(2)}` },
    { header: 'Lab', render: r => `$${r.labFee?.toFixed(2)}` },
    { header: 'Room', render: r => `$${r.roomFee?.toFixed(2)}` },
    { header: 'Total', render: r => <strong>${r.totalAmount?.toFixed(2)}</strong> },
    { header: 'Paid', render: r => <span style={{ color: '#34d399' }}>${r.paidAmount?.toFixed(2)}</span> },
    { header: 'Remaining', render: r => <span style={{ color: '#f87171' }}>${r.remainingAmount?.toFixed(2)}</span> },
    { 
      header: 'Status', 
      render: r => (
        <span className={`badge ${
          r.status === 'PAID' ? 'badge-success' :
          r.status === 'PARTIAL' ? 'badge-warning' : 'badge-danger'
        }`}>
          {r.status}
        </span>
      ) 
    },
    {
      header: 'Actions',
      render: r => (
        <div>
          {r.remainingAmount > 0 && (
            <Link to="/payments" className="btn btn-success btn-sm">
              <CreditCard size={14} /> Pay Now
            </Link>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Patient Billing & Invoices</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Itemized Medical Charges & Invoice Statements</p>
        </div>
        {(user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Generate New Bill
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search bills by patient or payment status..." />
        </div>
        <DataTable columns={columns} data={filteredBills} loading={loading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Patient Invoice">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Patient *</label>
            <select required value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })}>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.user?.fullName}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Link Admission (Optional)</label>
            <select value={formData.admissionId} onChange={e => setFormData({ ...formData, admissionId: e.target.value })}>
              <option value="">Select Admission (Optional)</option>
              {admissions.map(a => <option key={a.id} value={a.id}>Admission #{a.id} - Room {a.room?.roomNumber}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Consultation Fee ($)</label>
              <input type="number" step="0.01" value={formData.consultationFee} onChange={e => setFormData({ ...formData, consultationFee: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Medicine Fee ($)</label>
              <input type="number" step="0.01" value={formData.medicineFee} onChange={e => setFormData({ ...formData, medicineFee: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Lab Test Fee ($)</label>
              <input type="number" step="0.01" value={formData.labFee} onChange={e => setFormData({ ...formData, labFee: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Room & Bed Fee ($)</label>
              <input type="number" step="0.01" value={formData.roomFee} onChange={e => setFormData({ ...formData, roomFee: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Other Miscellaneous Charges ($)</label>
            <input type="number" step="0.01" value={formData.otherCharges} onChange={e => setFormData({ ...formData, otherCharges: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Invoice Notes</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Bill breakdown details..." />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Generate Invoice</button>
        </form>
      </Modal>
    </div>
  );
};
