import React, { useEffect, useState } from 'react';
import { medicineService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Pill, Plus, AlertTriangle, RefreshCw } from 'lucide-react';

export const MedicinesPage = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState(null);
  const [addQty, setAddQty] = useState(10);

  const [formData, setFormData] = useState({
    name: '', category: 'Analgesic', manufacturer: 'PharmaCorp', price: 10.0, stockQuantity: 100, unit: 'Tablet', expiryDate: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await medicineService.getAll();
      setMedicines(res.data);
      setFilteredMedicines(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredMedicines(medicines);
    else {
      const q = search.toLowerCase();
      setFilteredMedicines(medicines.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.manufacturer?.toLowerCase().includes(q)
      ));
    }
  }, [search, medicines]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await medicineService.create(formData);
      setIsModalOpen(false);
      fetchMedicines();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add medicine');
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedMedId) return;
    try {
      await medicineService.updateStock(selectedMedId, parseInt(addQty));
      setIsStockModalOpen(false);
      fetchMedicines();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Medicine Name', render: r => <strong>{r.name}</strong> },
    { header: 'Category', accessor: 'category' },
    { header: 'Price ($)', render: r => `$${r.price?.toFixed(2)}` },
    { 
      header: 'Stock Level', 
      render: r => (
        <span className={`badge ${r.stockQuantity <= 15 ? 'badge-danger' : 'badge-success'}`}>
          {r.stockQuantity <= 15 && <AlertTriangle size={12} style={{ marginRight: 4 }} />}
          {r.stockQuantity} {r.unit}s
        </span>
      ) 
    },
    { header: 'Manufacturer', accessor: 'manufacturer' },
    { header: 'Expiry Date', accessor: 'expiryDate' },
    {
      header: 'Actions',
      render: r => (
        <div>
          {(user.role === 'PHARMACIST' || user.role === 'ADMIN') && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedMedId(r.id); setIsStockModalOpen(true); }}>
              <RefreshCw size={14} /> Adjust Stock
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Pharmacy & Medicine Stock</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pharmaceutical Inventory & Low-Stock Alerts</p>
        </div>
        {(user?.role === 'PHARMACIST' || user?.role === 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Medicine
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search medicines by name, category, or manufacturer..." />
        </div>
        <DataTable columns={columns} data={filteredMedicines} loading={loading} />
      </div>

      {/* Modal Add Medicine */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Medicine">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Medicine Name *</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Paracetamol 500mg" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Analgesic / Antibiotic" />
          </div>
          <div className="form-group">
            <label>Manufacturer</label>
            <input type="text" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Price ($) *</label>
              <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Stock Quantity *</label>
              <input type="number" required min="0" value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Unit</label>
              <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                <option value="Tablet">Tablet</option><option value="Capsule">Capsule</option><option value="Syrup">Syrup</option><option value="Injection">Injection</option>
              </select>
            </div>
            <div className="form-group">
              <label>Expiry Date</label>
              <input type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Save Medicine</button>
        </form>
      </Modal>

      {/* Modal Adjust Stock */}
      <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title="Adjust Stock Quantity">
        <form onSubmit={handleUpdateStock}>
          <div className="form-group">
            <label>Add / Restock Quantity (Use negative for removal)</label>
            <input type="number" required value={addQty} onChange={e => setAddQty(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Update Stock Level</button>
        </form>
      </Modal>
    </div>
  );
};
