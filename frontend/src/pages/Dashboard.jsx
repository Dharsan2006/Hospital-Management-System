import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardCard } from '../components/DashboardCard';
import { 
  Users, Stethoscope, UserCheck, Calendar, Pill, 
  DoorOpen, Receipt, DollarSign, Activity, AlertTriangle, CheckCircle, Clock 
} from 'lucide-react';
import { 
  appointmentService, patientService, doctorService, 
  medicineService, roomService, admissionService, billingService, prescriptionService 
} from '../api/services';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    patientsCount: 0,
    doctorsCount: 0,
    appointmentsCount: 0,
    activeAdmissionsCount: 0,
    availableRoomsCount: 0,
    pendingPrescriptionsCount: 0,
    lowStockMedicinesCount: 0,
    totalRevenue: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [apptsRes] = await Promise.all([
        appointmentService.getAll().catch(() => ({ data: [] }))
      ]);

      setRecentAppointments(apptsRes.data.slice(0, 5));

      if (user.role === 'ADMIN' || user.role === 'RECEPTIONIST') {
        const [patients, doctors, rooms, admissions, bills] = await Promise.all([
          patientService.getAll().catch(() => ({ data: [] })),
          doctorService.getAll().catch(() => ({ data: [] })),
          roomService.getAvailable().catch(() => ({ data: [] })),
          admissionService.getAll().catch(() => ({ data: [] })),
          billingService.getAll().catch(() => ({ data: [] }))
        ]);

        const revenue = bills.data.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
        const activeAdmitted = admissions.data.filter(a => a.status === 'ADMITTED').length;

        setStats(prev => ({
          ...prev,
          patientsCount: patients.data.length,
          doctorsCount: doctors.data.length,
          appointmentsCount: apptsRes.data.length,
          activeAdmissionsCount: activeAdmitted,
          availableRoomsCount: rooms.data.length,
          totalRevenue: revenue
        }));
      } else if (user.role === 'PHARMACIST') {
        const [lowStock, prescriptions] = await Promise.all([
          medicineService.getLowStock(15).catch(() => ({ data: [] })),
          prescriptionService.getAll().catch(() => ({ data: [] }))
        ]);
        const pending = prescriptions.data.filter(p => p.status === 'PENDING').length;
        setStats(prev => ({
          ...prev,
          lowStockMedicinesCount: lowStock.data.length,
          pendingPrescriptionsCount: pending
        }));
      } else {
        setStats(prev => ({
          ...prev,
          appointmentsCount: apptsRes.data.length
        }));
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard statistics...</div>;
  }

  return (
    <div>
      <div className="flex-between mb-20">
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
            Welcome back, {user?.fullName} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Role: <strong>{user?.role}</strong> | Hospital Operational Portal
          </p>
        </div>
      </div>

      {/* Role-based Statistics Cards Grid */}
      <div className="dashboard-grid">
        {(user.role === 'ADMIN' || user.role === 'RECEPTIONIST') && (
          <>
            <DashboardCard title="Total Patients" value={stats.patientsCount} icon={UserCheck} color="#10b981" />
            <DashboardCard title="Active Doctors" value={stats.doctorsCount} icon={Stethoscope} color="#06b6d4" />
            <DashboardCard title="Total Appointments" value={stats.appointmentsCount} icon={Calendar} color="#3b82f6" />
            <DashboardCard title="Total Revenue Collected" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} color="#8b5cf6" />
            <DashboardCard title="Active Admissions" value={stats.activeAdmissionsCount} icon={DoorOpen} color="#f43f5e" />
            <DashboardCard title="Available Rooms" value={stats.availableRoomsCount} icon={DoorOpen} color="#f59e0b" />
          </>
        )}

        {user.role === 'DOCTOR' && (
          <>
            <DashboardCard title="My Appointments" value={stats.appointmentsCount} icon={Calendar} color="#06b6d4" />
            <DashboardCard title="Available Rooms" value={stats.availableRoomsCount || 5} icon={DoorOpen} color="#10b981" />
          </>
        )}

        {user.role === 'PHARMACIST' && (
          <>
            <DashboardCard title="Pending Prescriptions" value={stats.pendingPrescriptionsCount} icon={Clock} color="#f59e0b" />
            <DashboardCard title="Low Stock Alerts" value={stats.lowStockMedicinesCount} icon={AlertTriangle} color="#f43f5e" />
          </>
        )}

        {user.role === 'PATIENT' && (
          <>
            <DashboardCard title="My Appointments" value={stats.appointmentsCount} icon={Calendar} color="#06b6d4" />
            <DashboardCard title="Account Status" value="Active" icon={CheckCircle} color="#10b981" />
          </>
        )}
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 16 }}>
          ⚡ Quick Portal Shortcuts
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {(user.role === 'ADMIN' || user.role === 'RECEPTIONIST' || user.role === 'PATIENT') && (
            <Link to="/appointments" className="btn btn-primary">
              <Calendar size={16} /> Book Appointment
            </Link>
          )}

          {user.role === 'DOCTOR' && (
            <>
              <Link to="/medical-records" className="btn btn-primary"><Activity size={16} /> Add Medical Record</Link>
              <Link to="/prescriptions" className="btn btn-secondary"><Pill size={16} /> Write Prescription</Link>
            </>
          )}

          {user.role === 'PHARMACIST' && (
            <>
              <Link to="/prescriptions" className="btn btn-primary"><Pill size={16} /> Dispense Medicines</Link>
              <Link to="/medicines" className="btn btn-secondary"><Activity size={16} /> Inventory Stock</Link>
            </>
          )}

          {(user.role === 'RECEPTIONIST' || user.role === 'ADMIN') && (
            <>
              <Link to="/patients" className="btn btn-secondary"><UserCheck size={16} /> Register Patient</Link>
              <Link to="/billing" className="btn btn-secondary"><Receipt size={16} /> Generate Invoice</Link>
            </>
          )}

          {user.role === 'PATIENT' && (
            <>
              <Link to="/medical-records" className="btn btn-secondary"><Activity size={16} /> My Medical History</Link>
              <Link to="/billing" className="btn btn-secondary"><Receipt size={16} /> Pay Outstanding Bills</Link>
            </>
          )}
        </div>
      </div>

      {/* Recent Appointments Table Overview */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 16 }}>
          📅 Recent Appointments
        </h3>
        {recentAppointments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No appointments booked yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map(appt => (
                  <tr key={appt.id}>
                    <td>{appt.appointmentDate} at {appt.appointmentTime}</td>
                    <td>{appt.patient?.user?.fullName || 'N/A'}</td>
                    <td>{appt.doctor?.user?.fullName || 'N/A'}</td>
                    <td>{appt.reason || 'General Checkup'}</td>
                    <td>
                      <span className={`badge ${
                        appt.status === 'CONFIRMED' ? 'badge-success' :
                        appt.status === 'COMPLETED' ? 'badge-info' :
                        appt.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
