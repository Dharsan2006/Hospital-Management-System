import React, { useEffect, useState } from 'react';
import { paymentService, billingService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Plus, ShieldAlert, CheckCircle } from 'lucide-react';

export const PaymentsPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [bills, setBills] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    billId: '', amount: '', paymentMethod: 'CARD', transactionId: '', remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pmts, bls] = await Promise.all([
        paymentService.getAll(),
        billingService.getAll()
      ]);
      setPayments(pmts.data);
      setFilteredPayments(pmts.data);
      setBills(bls.data.filter(b => b.remainingAmount > 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredPayments(payments);
    else {
      const q = search.toLowerCase();
      setFilteredPayments(payments.filter(p =>
        p.patient?.user?.fullName?.toLowerCase().includes(q) ||
        p.paymentMethod?.toLowerCase().includes(q) ||
        p.transactionId?.toLowerCase().includes(q)
      ));
    }
  }, [search, payments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const selectedBill = bills.find(b => b.id === parseInt(formData.billId));
      if (!selectedBill) {
        setError('Please select a valid bill.');
        return;
      }

      const amt = parseFloat(formData.amount);

      // Frontend check matching backend business rule
      if (amt > selectedBill.remainingAmount) {
        setError(`Payment amount ($${amt}) cannot exceed remaining bill balance ($${selectedBill.remainingAmount.toFixed(2)}).`);
        return;
      }

      const payload = {
        billId: parseInt(formData.billId),
        patientId: selectedBill.patient.id,
        amount: amt,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId,
        remarks: formData.remarks
      };

      await paymentService.process(payload);
      setIsModalOpen(false);
      setFormData({ billId: '', amount: '', paymentMethod: 'CARD', transactionId: '', remarks: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process payment.');
    }
  };

  const columns = [
    { header: 'Txn ID', render: r => <code>{r.transactionId}</code> },
    { header: 'Payment Date', render: r => r.paymentDate ? new Date(r.paymentDate).toLocaleString() : 'N/A' },
    { header: 'Patient', render: r => r.patient?.user?.fullName || 'N/A' },
    { header: 'Bill #', render: r => `#${r.bill?.id}` },
    { header: 'Amount Paid', render: r => <strong style={{ color: '#34d399' }}>${r.amount?.toFixed(2)}</strong> },
    { header: 'Method', render: r => <span className="badge badge-info">{r.paymentMethod}</span> },
    { header: 'Remarks', accessor: 'remarks' }
  ];

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Payment Transactions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Receipts, Credit Cards, Cash & UPI Payment Records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Process Payment
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search payments by transaction ID or patient..." />
        </div>
        <DataTable columns={columns} data={filteredPayments} loading={loading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Process Bill Payment">
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(244, 63, 94, 0.15)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem', marginBottom: 16 }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Unpaid Bill *</label>
            <select required value={formData.billId} onChange={e => {
              const bId = e.target.value;
              const selBill = bills.find(b => b.id === parseInt(bId));
              setFormData({ 
                ...formData, 
                billId: bId, 
                amount: selBill ? selBill.remainingAmount : '' 
              });
            }}>
              <option value="">Select Outstanding Bill</option>
              {bills.map(b => (
                <option key={b.id} value={b.id}>
                  Bill #{b.id} - {b.patient?.user?.fullName} (Remaining: ${b.remainingAmount?.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Payment Amount ($) *</label>
              <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Payment Method *</label>
              <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                <option value="CARD">CARD</option>
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Transaction / Reference ID</label>
            <input type="text" value={formData.transactionId} onChange={e => setFormData({ ...formData, transactionId: e.target.value })} placeholder="TXN-998201 (Optional)" />
          </div>

          <div className="form-group">
            <label>Remarks</label>
            <input type="text" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} placeholder="Payment confirmation note..." />
          </div>

          <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: 12 }}>
            <CheckCircle size={16} /> Complete Payment Transaction
          </button>
        </form>
      </Modal>
    </div>
  );
};
