import React, { useEffect, useState } from 'react';
import { labService, patientService, doctorService } from '../api/services';
import { DataTable } from '../components/DataTable';
import { SearchBar } from '../components/SearchBar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { FlaskConical, Plus, Check } from 'lucide-react';

export const LabTestsPage = () => {
  const { user } = useAuth();
  const [labResults, setLabResults] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState(null);

  const [requestData, setRequestData] = useState({
    patientId: '', doctorId: '', labTestId: '', remarks: ''
  });

  const [resultUpdateData, setResultUpdateData] = useState({
    status: 'COMPLETED', resultValue: '', remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resultsRes, testsRes] = await Promise.all([
        labService.getAllResults(),
        labService.getAllTests()
      ]);
      setLabResults(resultsRes.data);
      setFilteredResults(resultsRes.data);
      setLabTests(testsRes.data);

      if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
        const [pts, docs] = await Promise.all([
          patientService.getAll().catch(() => ({ data: [] })),
          doctorService.getAll().catch(() => ({ data: [] }))
        ]);
        setPatients(pts.data);
        setDoctors(docs.data);
        if (user.role === 'DOCTOR' && user.doctorId) {
          setRequestData(prev => ({ ...prev, doctorId: user.doctorId }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) setFilteredResults(labResults);
    else {
      const q = search.toLowerCase();
      setFilteredResults(labResults.filter(r =>
        r.patient?.user?.fullName?.toLowerCase().includes(q) ||
        r.labTest?.name?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q)
      ));
    }
  }, [search, labResults]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patientId: parseInt(requestData.patientId),
        doctorId: user.role === 'DOCTOR' ? user.doctorId : parseInt(requestData.doctorId),
        labTestId: parseInt(requestData.labTestId),
        remarks: requestData.remarks
      };
      await labService.requestTest(payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request lab test');
    }
  };

  const handleUpdateResultSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResultId) return;
    try {
      await labService.updateResult(selectedResultId, resultUpdateData);
      setIsResultModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update test result');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Requested Date', render: r => r.requestedDate ? new Date(r.requestedDate).toLocaleDateString() : 'N/A' },
    { header: 'Patient', render: r => r.patient?.user?.fullName || 'N/A' },
    { header: 'Test Name', render: r => <strong>{r.labTest?.name}</strong> },
    { header: 'Normal Range', render: r => r.labTest?.normalRange || r.normalRange || 'N/A' },
    { header: 'Test Result', render: r => <span style={{ color: '#34d399', fontWeight: 600 }}>{r.resultValue || 'Pending Result'}</span> },
    { 
      header: 'Status', 
      render: r => (
        <span className={`badge ${
          r.status === 'COMPLETED' ? 'badge-success' :
          r.status === 'IN_PROGRESS' ? 'badge-info' :
          r.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
        }`}>
          {r.status}
        </span>
      ) 
    },
    {
      header: 'Actions',
      render: r => (
        <div>
          {r.status !== 'COMPLETED' && (user.role === 'DOCTOR' || user.role === 'NURSE' || user.role === 'ADMIN') && (
            <button className="btn btn-primary btn-sm" onClick={() => { setSelectedResultId(r.id); setIsResultModalOpen(true); }}>
              <Check size={14} /> Enter Result
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Laboratory Tests & Diagnostics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lab Test Requisitions, Findings & Reports</p>
        </div>
        {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Request Lab Test
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search lab tests by patient, test name or status..." />
        </div>
        <DataTable columns={columns} data={filteredResults} loading={loading} />
      </div>

      {/* Modal Request Test */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Lab Test">
        <form onSubmit={handleRequestSubmit}>
          <div className="form-group">
            <label>Select Patient *</label>
            <select required value={requestData.patientId} onChange={e => setRequestData({ ...requestData, patientId: e.target.value })}>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.user?.fullName}</option>)}
            </select>
          </div>

          {user.role === 'ADMIN' && (
            <div className="form-group">
              <label>Select Doctor *</label>
              <select required value={requestData.doctorId} onChange={e => setRequestData({ ...requestData, doctorId: e.target.value })}>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.fullName}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Select Lab Test *</label>
            <select required value={requestData.labTestId} onChange={e => setRequestData({ ...requestData, labTestId: e.target.value })}>
              <option value="">Select Test Catalog</option>
              {labTests.map(lt => <option key={lt.id} value={lt.id}>{lt.name} (${lt.price})</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Clinical Notes / Remarks</label>
            <textarea value={requestData.remarks} onChange={e => setRequestData({ ...requestData, remarks: e.target.value })} rows={2} placeholder="Reason for lab order..." />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Submit Test Request</button>
        </form>
      </Modal>

      {/* Modal Enter Result */}
      <Modal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} title="Update Lab Test Findings">
        <form onSubmit={handleUpdateResultSubmit}>
          <div className="form-group">
            <label>Status</label>
            <select value={resultUpdateData.status} onChange={e => setResultUpdateData({ ...resultUpdateData, status: e.target.value })}>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="form-group">
            <label>Measured Result Value *</label>
            <input type="text" required value={resultUpdateData.resultValue} onChange={e => setResultUpdateData({ ...resultUpdateData, resultValue: e.target.value })} placeholder="e.g. WBC: 6.5 x10^3/uL (Normal)" />
          </div>

          <div className="form-group">
            <label>Pathologist Remarks</label>
            <textarea value={resultUpdateData.remarks} onChange={e => setResultUpdateData({ ...resultUpdateData, remarks: e.target.value })} rows={2} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>Save Test Results</button>
        </form>
      </Modal>
    </div>
  );
};
